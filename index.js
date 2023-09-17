require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Replace 'YOUR_BOT_TOKEN' with the API token from the BotFather
const TOKEN = process.env.API_KEY;

// Create a new bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '/details - Enter booking code "/details BFDC35" ');
});

// Handle the /hello command
bot.onText(/\/hello/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hi there! How can I assist you?");
});
bot.onText(/(\w+\s+)?\/details(\s+\w+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(match);
  console.log(match);
  const userMessage = match.input
    .replace("/details", " ")
    .replace("@BetDetailsBot", "");
  var codeList = userMessage.split(" ");
  codeList = codeList.filter((item) => item !== "");

  if (codeList) {
    codeList.map(async (code) => {
      const { data, totalOdds, error } = await getBetDetails(code, chatId);
      if (error) {
        bot.sendMessage(chatId, error);
      } else {
        bot.sendMessage(
          chatId,
          ` 
          |------------------------------------------------------------|
          Bet code (${code} ) 
          [View game(s) on web](http://www.sportybet.com/ng/?shareCode=${code}) 
          ${data}
          Total odds >>>>>> ${totalOdds} \n
          |------------------------------------------------------------|
          `,
          {
            parse_mode: "Markdown",
          }
        );
      }
    });
  } else {
    bot.sendMessage(chatId, "You mentioned me, but your message was empty.");
  }
});
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.match(/(\w+\s+)?\@SportySlipBot(\s+\w+)?/)) {
    const userMessage = msg.text
      .replace("@BetDetailsBot", "")
      .replace("/details", " ");
    const codeList = userMessage.split(" ").filter((item) => item !== "");

    if (codeList.length > 0) {
      codeList.forEach(async (code) => {
        const { data, totalOdds, error } = await getBetDetails(code, chatId);
        if (error) {
          bot.sendMessage(chatId, error);
        } else {
          bot.sendMessage(
            chatId,
            ` 
          |------------------------------------------------------------|
          Bet code (${code} ) 
          [View game(s) on web](http://www.sportybet.com/ng/?shareCode=${code}) 
          ${data}
          Total odds >>>>>> ${totalOdds} \n
          |------------------------------------------------------------|
          `,
            {
              parse_mode: "Markdown",
            }
          );
        }
      });
    } else {
      bot.sendMessage(chatId, "You mentioned me, but your message was empty.");
    }
  }
});

const getBetDetails = async (betcode, id) => {
  try {
    const res = await fetch(
      `https://www.sportybet.com/api/ng/orders/share/${betcode}`
    );
    const data = await res.json();

    if (data.innerMsg === "Invalid") {
      return { error: data.message };
    } else {
      const details = data.data.outcomes; // Access the 'markets' array

      var betSlip = [];

      var totalOdds = 0;
      details.map((detail) => {
        betSlip = [
          ...betSlip,
          `
        ${detail.markets[0].outcomes[0].desc}
        -  ${detail.homeTeamName} vs ${detail.awayTeamName}           x ${detail.markets[0].outcomes[0].odds}
        ${detail.markets[0].desc} \n
                    `,
        ];
        totalOdds = totalOdds + Number(detail.markets[0].outcomes[0].odds);
      });
      console.log(totalOdds);
      totalOdds = totalOdds.toFixed(2);

      return { data: betSlip.join(""), totalOdds }; // Join the array elements into a single string
    }
  } catch (err) {}
};
