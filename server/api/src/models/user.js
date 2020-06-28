import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT = 10;

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            validate: {
                validator: function (email) {
                    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    return re.test(String(email).toLowerCase());
                },
                message: email => `${email.value} is not a valid email`,
            },
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            validate: {
                validator: function (password) {
                    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
                    return re.test(String(password));
                },
                message: 'Minimum eight characters, at least one letter, one number and one special character',
            },
        },
        role: {
            type: String,
            enum: ["Admin", "Editor", "Observer"],
            required: true,
        }
    },
    { timestamps: true },
);

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, SALT);
    next();
});

userSchema.pre('remove', function (next) {
    return null;
});


userSchema.statics.findByLogin = async function (login) {
    let user = await this.findOne({ email: login });

    return user;
};

userSchema.methods.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}


const User = mongoose.model('User', userSchema);

export default User;