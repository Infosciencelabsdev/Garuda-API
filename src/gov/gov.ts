import * as Mongoose from "mongoose";

export interface Tax {
    taxId: string;
    percent: number;
    propertyType: string;
}

export interface ITax extends Mongoose.Document, Tax {
    id: string;
}
export const TaxSchema = new Mongoose.Schema(
    {
        taxId: { type: String, unique: true, required: true },
        id: { type: String, unique: true, required: true, select: false },
        propertyType: { type: String, unique: true, required: false },
        percent: { type: Number, unique: false, required: true }
    },
    {
        timestamps: true
    });
TaxSchema.pre('validate', function (next) {
    const self = this;

    self.id = self.taxId;
    return next();
});
export const TaxModel = Mongoose.model<ITax>('tax_s', TaxSchema);