import * as Mongoose from "mongoose";

export interface Subscribe {
    userId: string;
    socketId: string;
    email: string;
    token: string;
    address: string;
    active: Boolean;
}

export interface ISubscribe extends Mongoose.Document, Subscribe {
    id: string;
}
export const subscribeSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true },
        userId: { type: String, required: true, sparse: true },
        email: { type: String, required: false, sparse: true },
        socketId: { type: String, required: true},
        token: { type: String, required: false},
        address: { type: String, required: false},
        active: { type: Boolean, required: false },
    },
    {
        timestamps: true
    });
// subscribeSchema.pre('validate', function (next) {
//     const self = this;
//     self.id = self.propertyId;
//     return next();
// });
export const subscribeModel = Mongoose.model<ISubscribe>('subscribe', subscribeSchema);

// export function initModel(payload, identity) {
//     let Marketplace: IModel = {
//     };
//     return Marketplace;
// }