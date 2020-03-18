import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import uuid = require("uuid");
import { INotification } from "../notification/push";
export var io;
export default class SocketController {
  io;
  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {winston.LoggerInstance} logger
   */
  constructor(
    private server: Hapi.Server,
    private configs: IServerConfigurations,
    private database: IDatabase,
    private logger: LoggerInstance) {
    // io = require('socket.io')(server.listener);
    this.io = require('socket.io')(server.listener);
    this.io.on('on_notification', async (data) => {
      let subscription = await database.subscribeModel.findOne({ 'userId': data.id });
      let notifications = await database.eventModel.find({ 'UserNotification.userId': data.id, 'UserNotification.read': false });
      io.to(subscription.socketId).emit('show_notification', notifications);
    });
    this.io.on('connection', function (socket) {
      logger.info('We have a user connected !' + socket.id);
      socket.on('login', async (data) => {
        let subscription = {
          id: uuid.v4(),
          socketId: socket.id,
          email: data.email,
          userId: data.id,
          token: data.token,
          active: true,
        };
        logger.info('User has logged in.' + socket.id);
        await database.subscribeModel.findOneAndUpdate({ email: subscription.email }, subscription, { upsert: true });
        let notifications = await database.eventModel.find({ 'UserNotification.userId': data.id, 'UserNotification.read': false });
        io.to(subscription.socketId).emit('show_notification', notifications);
      });
      socket.on('read_notification', async (data) => {
        let subscription = await database.subscribeModel.findOne({ 'userId': data.id });
        let notify = await database.eventModel.findOneAndUpdate({ id: data.notification.id, 'UserNotification.userId': data.id },
          {
            $set: {
              ["UserNotification.$.read"]: true
            }
          }, { new: true });
        let notifications = await database.eventModel.find({ 'UserNotification.userId': data.id, 'UserNotification.read': false });
        io.to(subscription.socketId).emit('show_notification', notifications);
      });
      socket.on('logout', async () => {
        logger.info('User disconnected!' + socket.id);
        await database.subscribeModel.findOneAndRemove({ socketId: socket.id });
      });
      socket.on('disconnect', async () => {
        await database.subscribeModel.findOneAndRemove({ socketId: socket.id });
      });
    });
    io = this.io;
    // (<any>server.app).io = io;  // to fix type issue in ApplicationState
  }
  async sendPrivateEvent(userId: string, notification: INotification) {
    try {
      let user = await this.database.subscribeModel.findOne({ userId: userId });
      if (user !== null) {
        notification.UserNotification[0].read = true;
        this.io.to(user.socketId).emit('show_notification', notification);
      }
      let event = await this.database.eventModel.create(notification);
      return event;
    } catch (error) {
      return Boom.boomify(error, { message: "Error while Send private event" });
    }
  }

  async sendEvent(notification: any) {
    try {
      let event = await this.database.eventModel.create(notification);
      notification.UserNotification.forEach(async (user) => {
        let subscription;
        if (user.userId) {
          subscription = await this.database.subscribeModel.findOne({ userId: user.userId });
        } else {
          subscription = await this.database.subscribeModel.findOne({ email: user.email });
        }
        if (subscription !== null) {
          console.log(subscription.socketId);
          io.to(subscription.socketId).emit('new_notification', notification);
        }
      });
      return event;
    } catch (error) {
      return Boom.boomify(error, { message: "Error while Send event" });
    }
  }
}