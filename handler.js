'use strict';
const AWS = require('aws-sdk');
const Alexa = require("alexa-sdk");
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = "amzn1.ask.skill.XXXX";
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'LaunchRequest': function () {
    this.emit('Prompt');
  },
  'Unhandled': function () {
    this.emit('AMAZON.HelpIntent');
  },
  'AddExpense': function () {

    var amount = this.event.request.intent.slots.Amount.value;
    var category = this.event.request.intent.slots.Category.value;
    var timestamp = new Date().getTime();
    var userId =  this.event.context.System.user.userId;

    if((typeof(amount) != "undefined") || (typeof(category) != "undefined")){

      console.log("\n\nLoading handler\n\n");

      const dynamodbParams = {
        TableName: process.env.DYNAMODB_TABLE_EXPENSES,
        Item: {
          id: uuid.v4(),
          userId: userId,
          amount: amount,
          category: category,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      };

    console.log('Attempting to add expense', dynamodbParams);

    dynamoDb.put(dynamodbParams).promise()
    .then(data => {
      console.log('expense saved: ', dynamodbParams);
      this.emit(':ask', 'Added '+ amount + ' for '+ category + '. Do you have more to add?');
    })
    .catch(err => {
      console.error(err);
      this.emit(':tell', 'Houston, we have a problem.');
    });

    }else{
      this.emit('NoMatch')
    }
  },
  'AMAZON.YesIntent': function () {
    this.emit('Prompt');
  },
  'AMAZON.NoIntent': function () {
    this.emit('AMAZON.StopIntent');
  },
  'Prompt': function () {
    this.emit(':ask', 'Please tell me the amount and category of your expense', 'Please say that again?');
  },
  'NoMatch': function () {
    this.emit(':ask', 'Sorry, I couldn\'t understand.', 'Please say that again?');
  },
  'AMAZON.HelpIntent': function () {
    const speechOutput = 'You need to mention expense amount and a category';
    const reprompt = 'Say hello, to hear me speak.';

    this.response.speak(speechOutput).listen(reprompt);
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak('Goodbye!');
    this.emit(':responseReady');
  },
  'AMAZON.StopIntent': function () {
    this.response.speak('See you later!');
    this.emit(':responseReady');
  }
};
