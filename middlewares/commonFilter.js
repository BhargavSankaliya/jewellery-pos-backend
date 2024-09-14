const { convertIdToObjectId } = require("../controllers/authController");

const commonFilter = {};

commonFilter.userCommonObject = {
    _id: 0,
    id: "$_id",
    firstName: 1,
    lastName: 1,
    username: 1,
    email: 1,
    profilePicture: 1,
    phoneNumber: 1,
    isPrivate: 1,
    fullName: {
        $concat: ["$firstName", " ", "$lastName"]
    },
    status: 1,
    createdAt: 1,
    bio: 1,
    gender: 1,
    businessType: 1,
    location: 1,
}


commonFilter.paginationCalculation = async (list, limit, page) => {
    return {
        currentPage: page,
        limit: limit,
        isLastPage: list.length >= limit ? false : true
    }
}

commonFilter.postCommonObject = (userId) => {
    return [
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: commonFilter.userCommonObject,
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "taggedUsersIDs",
                foreignField: "_id",
                as: "taggedUsersIDs",
                pipeline: [
                    {
                        $project: commonFilter.userCommonObject,
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "likes",
                foreignField: "_id",
                as: "likeUserList",
                pipeline: [
                    {
                        $project: commonFilter.userCommonObject,
                    },
                ],
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "post",
                as: "commentsList",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "commentedUser",
                            pipeline: [
                                {
                                    $project: commonFilter.userCommonObject,
                                },
                            ],
                        },
                    },
                    {
                        $unwind: {
                            path: "$commentedUser",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            replies: 0,
                            reports: 0,
                            isDeleted: 0,
                            updatedAt: 0,
                            deletedAt: 0
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ]
            },
        },
        {
            $project: {
                id: "$_id",
                _id: 0,
                caption: 1,
                image: 1,
                video: 1,
                hashtags: 1,
                permissions: 1,
                userId: 1,
                ownerDetails: 1,
                taggedUsers: 1,
                taggedUsersIDs: 1,
                likes: 1,
                createdAt: 1,
                likeUserList: 1,
                repostCount: {
                    $size: "$reposts"
                },
                viewCount: "0",
                favCount: {
                    $size: "$favoritePost"
                },
                shareCount: {
                    $size: "$favoritePost"
                },
                isLiked: {
                    $in: [convertIdToObjectId(userId), "$likes"]
                },
                isFavorite: {
                    $in: [convertIdToObjectId(userId), "$favoritePost"]
                },
                likeCount: {
                    $size: "$likes"
                },
                commentCount: {
                    $size: "$commentsList"
                },
                commentsList: {
                    $slice: ["$commentsList", 2]
                },
                postType: {
                    $cond: {
                        if: {
                            $or: [
                                {
                                    $gt: [{ $size: "$image" }, 0]
                                },
                                {
                                    $gt: [{ $size: "$video" }, 0]
                                }
                            ]
                        },
                        then: "media",
                        else: "text"
                    }
                }
            }
        },
    ]
}

commonFilter.commentCommonObject = (userId) => {
    return [
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "commentedUser"
            }
        },
        {
            $unwind: {
                path: "$commentedUser",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                isLiked: {
                    $in: [convertIdToObjectId(userId), "$likes"]
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                reports: 0
            }
        }
    ]
}

module.exports = { commonFilter };