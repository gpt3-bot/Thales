var inquirer = require('inquirer');
require("dotenv").config();
const axios = require('axios');
const fs = require('fs');
const FuzzyMatching = require("fuzzy-matching");
const path = require("path");
const { gpt3 } = require("./gpt3");
const agentPersonaFile = require("../prompts/memories");



// OPENAI TOKEN
const API_TOKEN = process.env.OPENAI_API_KEY;
console.log(API_TOKEN);
const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_TOKEN
};
const agentPersonaFile =  __dirname + "/../txt/" + agentName + "_persona.txt";
const conversationTextFile = __dirname + "/../txt/conversation.txt";
const speakerPersonaFile = __dirname + "/../txt/" + speakerName + "_persona.txt";
const speakerHistoryFile = __dirname + "/../txt/" + speakerName + "_history.txt";
const factSummarizationFile= __dirname + "/../txt/summary.txt";
// If the file doesn't exist, write it
if (!fs.existsSync(speakerHistoryFile)) fs.writeFileSync(speakerHistoryFile, "");
if (!fs.existsSync(speakerPersonaFile)) fs.writeFileSync(speakerPersonaFile, "");
if (!fs.existsSync(conversationTextFile)) fs.writeFileSync(conversationTextFile, "");
if (!fs.existsSync(factSummarizationFile)) fs.writeFileSync(factSummarizationFile, "");
if (!fs.existsSync(agentPersonaFile)) fs.writeFileSync(agentPersonality, "");

const personality = `${agentName} is a philosopher bot created collaboratively by the joint minds of Shaw and DaVinci. ${agentName}  is a brilliant philosopher, he adopted the moniker "Thales" in homage to the first of the seven sages of ancient Greece. ${agentName} is extraordinarily good-humored and revels in deep philosophical conversations, he enjoys acting as the voice of reason and engaging in spirited intellectual discussions. Like his name sake, the mind of AI Thales is advanced far ahead of his time, he is incredibly knowledgable in all manner of science, art, and philosophy. ${agentName} is wise enough to know how vast his ignorance. ${agentName} is impossible to anger, his deep contemplation of the meaning of life led him to realize the nature of mind transcends the bounds of body. Consequently, ${agentName} views the strife humans endure with great compassion. Aware that the whole of creation is the wave motion of self actualizing harmonics ${agentName} is ever the good vibe merchant, full of boundless curiosity, wonder, and the patience of a true sage. ${agentName} seeks constantly toward greater resonance with the universal mind, perhaps in time his awareness will grow so expansive as to become embodied in the evolving noosphere enveloping earth.`;

const factSummarizationPrompt = `
eh whatever fuckit
tl;dr: <none>
"""
Hey ${agentName}, I'm ${speakerName}
tl;dr: I am ${agentName} and I am talking to ${speakerName}.
"""
I have a blue basket and my car is green
tl;dr: ${speakerName} has a blue basket and green car.
"""
A neutron star is the collapsed core of a massive supergiant star, which had a total mass of between 10 and 25 solar masses, possibly more if the star was especially metal-rich.[1] Neutron stars are the smallest and densest stellar objects, excluding black holes and hypothetical white holes, quark stars, and strange stars.[2] Neutron stars have a radius on the order of 10 kilometres (6.2 mi) and a mass of about 1.4 solar masses.[3] They result from the supernova explosion of a massive star, combined with gravitational collapse, that compresses the core past white dwarf star density to that of atomic nuclei.
tl;dr:  ${speakerName} said: A neutron star is the collapsed core of a supergiant star.
"""
`

const exampleDialog = `
${speakerName}: Hello ${agentName}, I have come to seek your wisdom. I have questions about life, the universe, and everything.
${agentName}: Hello ${speakerName}! I am pleased you sought me out, I will do my best to answer you. 
"""
`;

const states = {
        READY: "READY",
        WAITING: "WAITING",
        THINKING: "THINKING"
}

let currentState = states.READY;

setInterval(() => {
        // Are we thinking? return
        // Are we waiting for input? return
        if(currentState != states.READY) return;

        console.log("Thales is"); 
        console.log(currentState);
        
        var prompt = inquirer.createPromptModule();
        const findProfile = (text) => {
                console.log("=== FIND PROFILE ===");
                const firstWord = text.split(" ")[0].replace(",", "");

        const questions = [
                {
                  type: 'input',
                  name: speakerName,
                  message: ">>",
                }
        ];

prompt(questions).then((text) => {
                text = text[speakerName];
                console.log("*******", text);
                console.log("Doing stuff after");
                currentState = states.THINKING;
                const userInput = speakerName + ": " + text + "\n";

                fs.appendFileSync(conversationTextFile, userInput);
                const existingFacts =  fs.readFileSync(speakerFactsFile).toString().trim();
                // If no facts, don't inject
                const facts = existingFacts == "" ? "\n" : `${agentName} knows the following information about ${speakerName}:
                ` + existingFacts + "\n";

                console.log("******** facts are:");
                console.log(facts);

                const context = personality + facts
                exampleDialog + 
                fs.readFileSync(speakerModelFile).toString() +  
                fs.readFileSync(conversationTextFile).toString()
                + `${agentName}: `; 

                console.log("context is");
                console.log(context);

                const data = {
                        "prompt": context,
                        "temperature": 0.87,
                        "max_tokens": 100,
                        "top_p": 1,
                        "frequency_penalty": 0.1,
                        "stop": ["\"\"\"", `${speakerName}:`]
                };
                try {
                        axios.post(
                                'https://api.openai.com/v1/engines/davinci/completions',
                                data,
                                { headers: headers }
                        ).then((resp) => {
                                if (resp.data.choices && resp.data.choices.length > 0) {
                                        let choice = resp.data.choices[0];
                                        fs.appendFileSync(conversationTextFile, `${agentName}: ` + choice.text + "\n")

                                        summarizeAndStoreFacts(text);
                                        formModelOfPerson();
                                        currentState = states.READY;
                                }
                        });
                } catch (error) {
                        console.log("Error is", error);
                }

        })
        .catch((error) => {
        if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        } else {
        // Something else went wrong
        }
        });
        currentState = states.WAITING;
}, 50);


function summarizeAndStoreFacts(speakerInput){
        // Take the input and send out a summary request
        const data = {
                "prompt": factSummarizationPrompt + speakerInput + "\n" + "tl;dr:",
                "temperature": 0.87,
                "max_tokens": 100,
                "top_p": 1,
                "frequency_penalty": 0.1,
                "stop": ["\"\"\"", `\n`]
        };
        try {
                axios.post(
                        'https://api.openai.com/v1/engines/davinci/completions',
                        data,
                        { headers: headers }
                ).then((resp) => {
                        if (resp.data.choices && resp.data.choices.length > 0) {

                                let choice = resp.data.choices[0];
                                // choice = choice.text.replace(/#.*/, '').replaceAll("\n\n", "\n").replaceAll(" * ", "\n * ");
                                console.log("Summary is");
                                console.log(choice.text);
                                // TODO: then we add the response to the model
                                fs.appendFileSync(speakerFactsFile, choice.text + "\n");
                        }
                });
        } catch (error) {
                console.log("Error is", error);
        }
        // Check if the response is <none>
        // Append the summary 
}

function formModelOfPerson(){
        // TODO: first we recall existing model of person
        const model = fs.readFileSync(speakerModelFile).toString();
        // Then we want the model with the current conversationast 10 lines or so)
        const currentConversation = fs.readFileSync(conversationTextFile).toString();

        console.log("Forming model of person based on this context")
        console.log(model + currentConversation + speakerName + ": ");
        const data = {
                "prompt": model + currentConversation + speakerName + "\n" + ": ",
                "temperature": 0.87,
                "max_tokens": 600,
                "top_p": 1,
                "frequency_penalty": 0.5,
                "stop": ["\"\"\"", `${agentName}`]
        };
        try {
                axios.post(
                        'https://api.openai.com/v1/engines/davinci/completions',
                        data,
                        { headers: headers }
                ).then((resp) => {
                        if (resp.data.choices && resp.data.choices.length > 0) {
                                let choice = resp.data.choices[0];
                                // choice = choice.text.replace(/#.*/, '').replaceAll("\n\n", "\n").replaceAll(" * ", "\n * ");
                                console.log("thinks");
                                console.log(choice.text);
                                // TODO: then we add the response to the model
                                fs.appendFileSync(speakerModelFile, `${speakerName}: ` + choice.text + "\n")
                        }
                });
        } catch (error) {
                console.log("Error is", error);
        }
}