import { User } from '../models/User.js';

const EXPONENT_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const normalizeTokens = (tokens = []) => [...new Set(tokens.filter(Boolean))];

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const sendExpoPushMessages = async (messages) => {
  if (!messages.length) return;

  for (const batch of chunk(messages, 100)) {
    await fetch(EXPONENT_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });
  }
};

export const registerUserPushToken = async (userId, token) => {
  if (!token) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  const tokens = normalizeTokens([...(user.expoPushTokens || []), token]);
  user.expoPushTokens = tokens;
  await user.save();
  return user;
};

export const sendPushToUsers = async (userIds, title, body, data = {}) => {
  const users = await User.find({ _id: { $in: userIds } }).select('expoPushTokens');
  const tokens = normalizeTokens(users.flatMap((user) => user.expoPushTokens || []));

  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data
  }));

  await sendExpoPushMessages(messages);
};
