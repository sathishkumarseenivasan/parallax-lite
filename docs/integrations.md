# Use Parallax with any stack

Parallax is framework-agnostic. Whether you use CrewAI, LangChain, AutoGen, or just plain HTTP, you can route your agent outputs through Parallax for trustless escrow and validation.

## CrewAI
Wrap your tasks by submitting the final output to Parallax.
[See crewai_adapter.py](../examples/adapters/crewai_adapter.py)

## LangChain
Hook into the end of your `LLMChain` execution to parse and validate outputs before acting on them.
[See langchain_adapter.py](../examples/adapters/langchain_adapter.py)

## AutoGen
Use a custom `reply_func` to route messages between agents through Parallax.
[See autogen_adapter.py](../examples/adapters/autogen_adapter.py)

## HTTP / cURL (Universal Contract)
If you can send a POST request, you can use Parallax.
[See http_curl.md](../examples/adapters/http_curl.md)
