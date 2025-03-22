from . import *

class Workflow:
    def __init__(self, agents: List['Agent']):
        assert len(agents)
        self.agentd = {}
        for i,agent in enumerate(agents):
            agent = agent.new(position=i+1)
            self.agentd[(agent.position,agent.name)] = agent
        self._run = False
        self._prompt = None
        self.bad_cols = {'verbose','prompt','system_prompt','run'}
    
    @property
    def agents(self):
        return list(self.agentd.values())
    
    @property
    def agents_in_position(self) -> List[List[Agent]]:
        return [list(group) for _, group in itertools.groupby(sorted(self.agents, key=lambda agent: agent.position), key=lambda agent: agent.position)]

    def run(self, user_prompt=None, _force=False,**prompt_kwargs):
        if not _force and self._prompt is not None: return self._prompt
        self._prompt = prompt = self.agents[0].prompt(user_prompt=user_prompt, **prompt_kwargs)
        user_prompt = prompt.user_prompt
        for agents in self.agents_in_position:
            for agent in agents:
                agent.generate(prompt=prompt, _force=_force, repr=True)
            for agent in agents:
                prompt.messages.add_agent_message(agent, agent._prompt.response)
            prompt.messages.add_user_message(user_prompt)
        return prompt
        
    def run_df(self, user_prompt=None, _force=False, **prompt_kwargs):
        prompt = self.run(user_prompt=user_prompt, _force=_force, **prompt_kwargs)        
        results = [agent.result_d for agent in self.agents]
        odf=pd.DataFrame(results)
        odf = odf[[x for x in odf if x!='system_prompt']]
        return odf.set_index([x for x in AgentModel.index_by if x in odf.columns]).sort_index()
    
    @property
    def df(self):
        return self.run_df()
    
    def sweep(self, user_prompt=None, n=10, temperature_range=(0.0,1.0), _force=False, models=None, **prompt_kwargs):
        l=[]
        run=0
        temperatures = [x/1000 for x in range(int(temperature_range[0]*1000),int(temperature_range[1]*1000+1))]
        options = []
        for _ in range(n):
            opt = {'temperature':random.choice(temperatures)}
            if models:
                opt['model'] = random.choice(models)
            options.append(opt)
        for option in progress_bar(options, desc='Sweeping'):
            run+=1
            agents = [agent.new(**option) for agent in self.agents]
            new = self.__class__(agents)
            l.append(new.run_df(user_prompt=user_prompt, _force=_force, **prompt_kwargs).reset_index().assign(run=run))
        if not l: return pd.DataFrame()
        odf=pd.concat(l)
        odf = odf.set_index([x for x in AgentModel.index_by if x in odf.columns]).sort_index()
        return odf

    @property
    def results(self):
        return [result for agent in self.agents for result in agent.results]
    
    @property
    def results_df(self):
        odf = pd.DataFrame(self.results)
        odf = odf[[x for x in odf if x not in self.bad_cols]]
        odf = odf.drop_duplicates(list(odf.columns))
        return odf.set_index([x for x in AgentModel.index_by if x in odf.columns]).sort_index() if len(odf) else odf