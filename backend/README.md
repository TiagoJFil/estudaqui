# Backend for estudaAqui

Built with fastapi

Make sure to have an LLM running.

# Env Variables

**LLM_URL**={URL of the api of the running LLM}
**OPENAI_URL**={URL of the open api LLM api}
**GOOGLE_CLOUD_OCR_URL**={URL for google cloud api}
**LOG_LEVEL**={LOG_LEVEL}


# Running the server

Make sure you have
- poetry >=2.0.0,<3.0.0
- python = ">=3.12"

## Linux
```
poetry env activate
poetry install
.\run.sh
```

## Windows
```
poetry env activate
poetry install
TODO: Make a batch file to start the server.
```
