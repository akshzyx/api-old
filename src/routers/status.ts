import { Router } from "express";
import os from "os-utils";

const statusRouter = Router();
const apiPrefix = process.env.API_PREFIX;

statusRouter.use(`*`, async (req, res) => {
  os.cpuUsage((cpuUsage) => {
    res.json({
      success: true,
      github: "https://github.com/netlob/spotistats-api",
      data: {
        platform: os.platform(),
        cpuUsage: cpuUsage,
        freeMem: os.freemem(),
        totalmem: os.totalmem(),
        freememPercentage: os.freememPercentage(),
        sysUptime: os.sysUptime(),
        processUptime: os.processUptime(),
        loadavg1: os.loadavg(1),
        loadavg5: os.loadavg(5),
        loadavg15: os.loadavg(15),
      },
    });
  });
});

export default statusRouter;
