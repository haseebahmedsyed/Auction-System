CREATE TABLE auctions (
    pk SERIAL PRIMARY KEY,
    auctionid UUID DEFAULT gen_random_uuid() NOT NULL,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(250) NOT NULL,
    status auctionstatus DEFAULT 'open' NOT NULL,
    starttime TIMESTAMP NOT NULL DEFAULT NOW(),
    endtime TIMESTAMP NOT NULL,
    startprice VARCHAR(100) NOT NULL,
    winningbidid UUID DEFAULT NULL,
    createdby UUID NOT NULL,
    CONSTRAINT unique_auctionid UNIQUE(auctionid)
);

CREATE TABLE itemimages (
    pk SERIAL PRIMARY KEY,
    imageid UUID DEFAULT gen_random_uuid() NOT NULL,
    imageurl VARCHAR(250) NOT NULL,
    auctionid UUID NOT NULL,
    FOREIGN KEY (auctionid) REFERENCES auctions(auctionid)
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);