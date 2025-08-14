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


CREATE TABLE payment_attempts (
    id SERIAL PRIMARY KEY,
    auction_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    seller_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    attempt_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_auction_customer (auction_id, customer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
); 