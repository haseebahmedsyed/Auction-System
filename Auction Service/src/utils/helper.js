const Database = require('./../database/connection')

exports.updateAuction = async (data) => {
    try {
        const { auctionid, ...dataToUpdate } = data;

        if (!auctionid || Object.keys(dataToUpdate).length === 0) {
            throw new Error("Invalid data: auctionid and fields to update are required.");
        }

        const columns = Object.keys(dataToUpdate);
        const columnValues = Object.values(dataToUpdate);

        // Generate the SET clause dynamically and avoid trailing comma
        const setClause = columns
            .map((column, idx) => `${column} = $${idx + 1}`)
            .join(", ");

        const query = `
            UPDATE auctions
            SET ${setClause}
            WHERE auctionid = $${columns.length + 1}
        `;

        const result = await Database.query(query, [...columnValues, auctionid]);

        console.log("Auction updated successfully", result.rows);
        return result; // Return the result if needed
    } catch (error) {
        console.error("Error updating auction:", error.message);
        throw error; // Rethrow the error for further handling
    }
};
