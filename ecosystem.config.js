module.exports = {
  apps: [
    {
      name: "worker",
      script: "src/worker/index.ts",
      interpreter: "./node_modules/.bin/tsx",
      instances: 4,
      exec_mode: "fork",
    },
  ],
};
