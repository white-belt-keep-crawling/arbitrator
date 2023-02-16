const config = require("./config.json");
const { Base64 } = require("js-base64");
const { appendFileSync } = require("fs");
const { BlazeClient } = require("mixin-node-sdk");
const client = new BlazeClient(config, { parse: true, syncAck: true });

const group = "b8fa64a3-1725-428b-9be7-30e1f7f9aaf8";
const receivers = [
  "cbb20923-9020-490a-b8f6-e816883c9c99",
  "d86ca453-e506-407a-ae61-e73bad0e4331",
  client.keystore.client_id,
];
const threshold = 2;
const mumu = "cbb20923-9020-490a-b8f6-e816883c9c99";

client.loopBlaze({
  async onMessage(msg) {
    if (msg.user_id === mumu) {
      client.sendMessageText(mumu, msg.conversation_id);
    }
  },
  async onTransfer(msg) {
    const user = await toArbitrator(msg);
    await toMultiSignAddress(msg, user);
  },
});

async function toArbitrator({ data, created_at, user_id }) {
  const time = new Date(created_at).toLocaleString();
  const user = (await client.readUser(user_id)).full_name;
  const amount = data.amount;
  const symbol = (await client.readAsset(data.asset_id)).symbol;
  const msg_recive_crypto = `Arbitrator ${time} 收到 "${user}" 转账 ${amount} ${symbol};`;
  await toGroup(msg_recive_crypto, group);
  return user;
}

async function toGroup(data, group) {
  client.sendMessages({
    conversation_id: group,
    message_id: client.newUUID(),
    category: "PLAIN_TEXT",
    data: Base64.encode(data),
  });
  console.log(data);
  appendFileSync("./record.json", data + "\n");
}

async function toMultiSignAddress({ data, created_at }, user) {
  const rec = await client.transaction({
    asset_id: data.asset_id,
    amount: data.amount,
    trace_id: client.newUUID(),
    memo: "小白慢爬营编程共创",
    opponent_multisig: {
      receivers,
      threshold,
    },
  });
  const symbol = (await client.readAsset(rec.asset_id)).symbol;
  const amount = (parseFloat(rec.amount) * -1).toString();
  const msg_recive_crypto = `多签钱包 ${new Date(
    created_at
  ).toLocaleString()} 收到来自 "${user}" 的转账 ${symbol} ${amount};\n点击查看交易快照：https://mixin.one/snapshots/${
    rec.snapshot_id
  }`;
  await toGroup(msg_recive_crypto, group);
}
