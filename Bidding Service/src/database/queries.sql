CREATE TABLE bids (
    pk SERIAL PRIMARY KEY,
    bidid UUID DEFAULT gen_random_uuid() NOT NULL,
    userid VARCHAR(50) NOT NULL,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW(),
    price VARCHAR(100) NOT NULL,
    auctionid UUID NOT NULL,
    CONSTRAINT unique_bidid UNIQUE(bidid)
);