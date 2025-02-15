const axios = require('axios')
const jwt = require('jsonwebtoken');

getJsonWebToken = (data) => {
    let token = jwt.sign({
        data: data
    }, process.env.SERVICE_TOKEN, { expiresIn: 15 * 60 * 1000 });

    return token;
}

exports.queryAuction = async (auctionid) => {
    let { data } = await axios.get(`http://localhost:8989/auction-service/get-auction/${auctionid}`,
        {
            headers: {
                'servicetoken': getJsonWebToken({ auctionid })  // Forward HTTP-only cookies from client request
            },
            withCredentials: true
        }
    );
    return data;
}