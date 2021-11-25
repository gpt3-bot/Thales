export const gpt3 = {
    'API_TOKEN': process.env.OPENAI_API_KEY,
    'headers': {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer ' + API_TOKEN
    };
    
    "engine": davinci,
    "temperature": 0.87,
    "max_tokens": 100,
    "top_p": 1,
    "frequency_penalty": 0.5,
    "presence_penalty": 0.5,
    "start": ${agentName},
    "stop": ${speakerName},
    "context": 6,
    "memory": 5,
  };
  export const maxContext = 6;
  export const google = {
    projectId: "jsonresume-registry",
  };
