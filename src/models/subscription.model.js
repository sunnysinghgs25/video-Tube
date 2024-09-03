import mongoose,{Schema} from "mongoose";;

const subscriptionSchema = new Schema({
    subscriber:{
        type :Schema.type.ObjectId,
        ref:"User"
    },
    channel:{
        type :Schema.type.ObjectId,
        ref:"User"
    }
})
export const Subscription = mongoose.model("Subscription",subscriptionSchema);