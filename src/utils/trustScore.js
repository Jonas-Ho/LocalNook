/**
 * trustScore = (upvotes * 2) + visitedCount
 * upvotes = number of unique users who upvoted
 */
const calculateTrustScore = (upvoteCount, visitedCount) => {
  return upvoteCount * 2 + visitedCount;
};

module.exports = { calculateTrustScore };