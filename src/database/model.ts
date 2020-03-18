import * as Mongoose from 'mongoose';

export interface Index extends Mongoose.Document {
    id: string;
    index: number;
    page: number;
    createdAt: Date;
    updateAt: Date;
}
export const IndexSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true },
        index: { type: Number, unique: false, required: true },
        page: { type: Number, unique: false, required: true },
    },
    {
        timestamps: true
    });
IndexSchema.pre('save', function (next) {
    const user = this;
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at) {
        this.created_at = currentDate;
    }
    if (!user.isModified('password')) {
        return next();
    }
    user.password = user.password;

    return next();
});

IndexSchema.pre('findOneAndUpdate', function () {
    const password = this.getUpdate().$set.password;

    if (!password) {
        return;
    }

    this.findOneAndUpdate({}, { password: password });
});
export const IndexModel = Mongoose.model<Index>('IndexOwn', IndexSchema);