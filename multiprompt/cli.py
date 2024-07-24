import argparse
from .server import main as server_main
from .repo2llm import main as repo_main

def main():
    parser = argparse.ArgumentParser(description="multiprompt command-line tool")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Copy command
    copy_parser = subparsers.add_parser("copy", help="Run repo2llm on a path")
    copy_parser.add_argument("path", help="Path to the repository or GitHub URL")
    copy_parser.add_argument("-o", "--output", help="Output file path (default: .robots.md)", default='.robots.md')

    # Server command
    server_parser = subparsers.add_parser("server", help="Start the multiprompt server")
    server_parser.add_argument("--host", default="127.0.0.1", help="Host to run the server on")
    server_parser.add_argument("--port", type=int, default=8000, help="Port to run the server on")

    args = parser.parse_args()
    if args.command == "copy":
        repo_main(args.path, output_file=args.output)
    elif args.command == "server":
        server_main()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()