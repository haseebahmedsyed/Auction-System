CREATE TABLE seller (
    pk SERIAL PRIMARY KEY,
    sellerid UUID DEFAULT gen_random_uuid() NOT NULL,
    stripeid VARCHAR(50) NOT NULL,
    userid VARCHAR(50) NOT NULL
);


CREATE TABLE customer (
    pk SERIAL PRIMARY KEY,
    customerid UUID DEFAULT gen_random_uuid() NOT NULL,
    stripeid VARCHAR(50) NOT NULL,
    paymentmethod VARCHAR(50) NOT NULL,
    userid VARCHAR(50) NOT NULL
);