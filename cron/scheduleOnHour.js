require('dotenv').config();
const CronJob = require('cron').CronJob;
const mongoose = require('mongoose');
const Schedule = require('../models/schedule');

const io = require('../helpers/socketClient');

module.exports = () => {
  console.log('cron on triger');

  new CronJob(
    `0 */1 * * * *`,
    function() {
      let MONGO_URI = {
        development: `mongodb://${process.env.dbProdAdm}:${
          process.env.dbProdAdm
        }@ds259912.mlab.com:59912/susidb`,
        test: `mongodb://${process.env.dbTestAdm}:${
          process.env.dbTestAdm
        }@ds259912.mlab.com:59912/susidbtest`
      };
      mongoose.connect(
        MONGO_URI[process.env.NODE_ENV],
        { useNewUrlParser: true, useCreateIndex: true },
        async function(err) {
          if (err) console.log('connect with mLab on error : ', err);
          try {
            console.log('===============================================');
            let now = new Date();
            now.setSeconds(0);
            let nextMinute = new Date(now.getTime() + 60000);
            nextMinute.setSeconds(0);

            let scheduleOnDb = await Schedule.find({
              time: {
                $gte: now,
                $lt: nextMinute
              }
            })
              .populate('userId')
              .populate('prescriptionId')
              .exec();

            console.log(
              'time on tick on minute : ',
              now.toLocaleString(),
              '; range :',
              nextMinute.toLocaleString()
            );
            console.log('--------------------------------------------------');
            scheduleOnDb.forEach(e => {
              console.log(
                `${e.onSchedule} ini ${e.userId.name} saatnya minum obat : ${
                  e.prescriptionId.label
                }, stock : ${e.prescriptionId.stock}`
              );
              io.emit('medicationRemind', {
                username: e.userId.name,
                medicineLabel: e.prescriptionId.label
              });
            });
            console.log('--------------------------------------------------');

            console.log('===============================================');
          } catch (error) {
            console.log(error);
          }
        }
      );
    },
    null,
    true,
    'Asia/Jakarta'
  );
};
