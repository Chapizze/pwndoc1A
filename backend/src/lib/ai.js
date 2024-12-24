//Author : Chapizze

const fetch = require('node-fetch');


async function rephrase(content) {

    const body = {
        model: "llama",
        messages: [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "assistant",
                "content": `This is the paragraph to rephrase: ${content}`
            },
            {
                "role": "user",
                "content": "rephrase the paragraph."
            }
        ],
        temperature: 0.0
    };

   const res = await fetch('http://llama-server:8888/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer foobar'
        },
        body: JSON.stringify(body)
    })
    const data = await res.json()

    const text = data.choices[0].message.content;
  
    return text


}
exports.rephrase = rephrase;