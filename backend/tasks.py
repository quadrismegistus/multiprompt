# tasks.py
from config import *

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

@celery_app.task
def fetch_repo_content(repo_url):
    reader = GitHubRepoReader(repo_url)
    markdown_content = reader.markdown
    return markdown_content
