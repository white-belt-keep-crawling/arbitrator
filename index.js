const config = require("./config.json");
const { Base64 } = require("js-base64");
const { appendFileSync } = require("fs");
const { BlazeClient } = require("mixin-node-sdk");
const client = new BlazeClient(config, { parse: true, syncAck: true });

const group = "9fe64c07-71d1-44a2-85c1-3694e1ede7ee";
const receivers = [
  //小熊
  "f264c736-7a90-4475-a253-981d654c1e21",
  //爱梅
  "a6c8155c-9493-4034-84a8-83f8edc56cf6",
  //阿坦
  "fedd7458-bdfc-488c-87be-6225ee3cf523",
  //志全
  "9dcd64cf-d753-4c53-87d0-bc011fd94cb3",
  //放鹅娃
  "9b483aab-eda5-49ff-b111-328206dedb1a",
  //机器人
  client.keystore.client_id,
];
const threshold = 3;
const mumu = "cbb20923-9020-490a-b8f6-e816883c9c99";

client.loopBlaze({
  async onMessage(msg) {
    if (msg.user_id === mumu) {
      client.sendMessageText(mumu, msg.conversation_id);
    }
    if (
      msg.data.toString().substring(0, 11) === "@7000104916" &&
      msg.data.toString().substring(11).trim() === "$"
    ) {
      // await transferButton();
      console.log("$");
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

async function transferButton() {
  const transferAction = `mixin://transfer/${client.keystore.client_id}`;
  await client.sendAppButtonMsg(
    // 给用户发送转账的 button
    user_id,
    [
      {
        label: `Transfer to ${client.keystore.client_id}`,
        action: transferAction,
        color: "#000",
      },
    ]
  );
}

// let data = [{
//   label: "签到",
//   action: "input:@7000104895/claim",
//   color: "#FF0000",
// }];

// data = JSON.stringify(data);

// console.log(data);

// client
//   .sendMessage({
//     conversation_id: group,
//     message_id: client.newUUID(),
//     category: "APP_BUTTON_GROUP",
//     data: Buffer.from(data).toString("base64url"),
//     // data: Base64.encode(data)
//   })
//   .then(console.log);


