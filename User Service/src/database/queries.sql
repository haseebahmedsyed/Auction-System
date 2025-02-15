CREATE TABLE otp (
    pk SERIAL PRIMARY KEY,  -- Auto-incrementing primary key
    id UUID DEFAULT gen_random_uuid() NOT NULL,  -- UUID column
    contact VARCHAR(100) NOT NULL,  -- Contact column
    otp VARCHAR(6) NOT NULL,  -- OTP column
    expiration BIGINT NOT NULL,  -- Expiration time in milliseconds
    createdat TIMESTAMP DEFAULT NOW(),  -- Timestamp of creation
    CONSTRAINT unique_id UNIQUE(id)  -- Ensure the 'id' is unique
);


CREATE TABLE users (
    pk SERIAL PRIMARY KEY,  -- Auto-incrementing primary key
    userid UUID DEFAULT gen_random_uuid() NOT NULL,  -- Unique identifier
    phone VARCHAR(15) NOT NULL,  -- Phone number with a max length of 15
    address VARCHAR(255) NOT NULL,  -- Address with a reasonable length
    username VARCHAR(50) NOT NULL,  -- Username with a max length of 50
    role user_role DEFAULT 'bidder' NOT NULL,  -- Use ENUM type for role
    password VARCHAR(255) NOT NULL,  -- Password hash with sufficient length
    fullname VARCHAR(100) NOT NULL,  -- Full name with max length of 100
    createdat TIMESTAMP DEFAULT NOW(),  -- Timestamp for creation
    updateddat TIMESTAMP DEFAULT NOW(),  -- Timestamp for last update
    CONSTRAINT unique_userid UNIQUE(userid),  -- Enforce unique UUIDs
    CONSTRAINT unique_username UNIQUE(username)  -- Enforce unique usernames
);