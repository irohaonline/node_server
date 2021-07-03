const records = [
  {
    id: 1,
    username: "aaa",
    password: "sss",
    // displayName: "Jack",
    // emails: [{ value: "jack@example.com" }],
  },
];

exports.findByUsername = (username, cb) => {
  process.nextTick(() => {
    for (let i = 0; i < records.length; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
};
