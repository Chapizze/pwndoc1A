
# Overview

In **Pwndoc1A**, AI-powered tools are utilized to significantly enhance report creation speed and quality, resulting in more efficient and effective documentation processes.

For the moment, the usage of AI is limited to rephrase paragraph as simple instruction. 

There is a work in progress is to add another instructions and enhance paragraph

**Note** : The model and server are self-hosted, meaning that all data submitted to the AI system is processed and stored internally within the system, rather than being sent to an external server or cloud-based infrastructure.

## **Docker Image**


A docker image has been created with all the necessary setup to run a llama-server. The docker image is named `chapizze/llama:1.0`, which includes:

- Ubuntu 22.04
- Llama-3.2-1B-Instruct-GGUF model
- Llama server from the llama.cpp project (https://github.com/ggerganov/llama.cpp)

## **Dockerfile**

The Dockerfile for launching the llama server is as follows:


```Docker
CMD ./build/bin/llama-server --api-key foobar -m models/Llama-3.2-1B-Instruct-Q6_K.gguf -ngl 0 -a llama --host 0.0.0.0 --port 8888 -c 8192
```

## **API**

The llama-server uses the OpenAI REST API 

Reference : https://platform.openai.com/docs/api-reference/making-requests
