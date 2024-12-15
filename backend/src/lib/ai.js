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

    var text = data.choices[0].message.content;

    const newlineIndex = text.indexOf('\n');

    text = text.slice(newlineIndex +3);
    text = text.slice(0, -1);
  
    return text


}
exports.rephrase = rephrase;