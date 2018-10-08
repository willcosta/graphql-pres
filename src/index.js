const { GraphQLServer, PubSub } = require('graphql-yoga')
const axios = require('axios');

const typeDefs = `
  type Query {
    # returns a list of auctions
    auctions(start: Int, limit: Int): [Auction]!
    
    # get an Auction by id
    auction(id: ID): Auction!

    # returns a list of Offers
    offers(start: Int, limit: Int): [Offer]!
    
    # get an Offer by id
    offer(id: ID): Offer!
  }

  type Mutation {
      increaseOfferVisits(id: Int!): Boolean
  }

  type Subscription {
    whatTimeIsIt: String!
  }

  type Auction{
      id: ID!
      "The name of the Auction"
      description : String!
      "A list containing all the offers on this auction"
      offers : [Offer]!
  }

  type Offer{
      id: ID!
      lotNumber : Int!
      visits: Int!
      productShortDesc : String!
      auction : Auction!
      currentMinBidFormatted : String!
      endDateFormatted: String!
      gallery: [GalleryItem]
      fullDesc: String
  }

  type GalleryItem{
      contentType: String
      link: String
  }
`;

const BASE_API_URI = 'https://api.s4bdigital.net:443';
const DEFAULT_HEADERS = {headers: {'client_id' : '61922-pof198w5fn6r1e610p62hbtqe974l63y-swagger-ui'}};

const resolvers = {
  Query: {
    auctions : (parent, { id, start=0, limit=5 }) => {
        return new Promise((resolve, reject) => {
            axios.get(`${BASE_API_URI}/auction-query/lc/portal/2/auction/?start=${start}&limit=${limit}`, DEFAULT_HEADERS)
            .then((res) => {
                resolve(res.data.auctions);
            })
        });
    },

    auction : (parent, { id }) => {
        return new Promise((resolve, reject) => {
            axios.get(`${BASE_API_URI}/auction-query/lc/auction/${id}`, DEFAULT_HEADERS)
            .then((res) => {
                resolve(res.data);
            })
        });
    },

    offers : (parent, {start=0, limit=5}) => {
        return new Promise((resolve, reject) => {
            axios.get(`${BASE_API_URI}/auction-query/lc/portal/2/offers?q=status=2`, DEFAULT_HEADERS)
            .then((res) => {
                resolve(res.data.offers);
            })
        });
    },

    offer : (parent, {id}) => {
        return new Promise((resolve, reject) => {
            axios.get(`${BASE_API_URI}/auction-query/lc/offer/${id}`, DEFAULT_HEADERS)
            .then((res) => {
                resolve(res.data);
            })
        });
    }
    
  },

  Mutation: {
      increaseOfferVisits: (parent, {id}) => {
          return new Promise((resolve, reject) => {
              axios.post(`${BASE_API_URI}/auction-event/visit/offer/${id}`, {}, DEFAULT_HEADERS)
              .then((res) => {
                resolve(true);
              })
          })
      }
  },
  
  Subscription: {
    whatTimeIsIt: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).substring(2, 15) // random channel name
        let count = 0
        setInterval(() => pubsub.publish(channel, { whatTimeIsIt: new Date().toISOString() }), 5000)
        return pubsub.asyncIterator(channel)
      },
    }
  },

  Auction: {
      offers: (parent) => {
          const {id} =  parent;
          
          return new Promise((resolve, reject) => {
            axios.get(`${BASE_API_URI}/auction-query/lc/portal/2/offers?q=status=2:auctionId=${id}`, DEFAULT_HEADERS)
            .then((res) => {
                resolve(res.data.offers);
            })
        });
      }
  },

  Offer: {
    fullDesc: (parent) => {
        const {id} =  parent;
        
        return new Promise((resolve, reject) => {
          axios.get(`${BASE_API_URI}/auction-query/lc/offer/${id}/full-desc`, DEFAULT_HEADERS)
          .then((res) => {
              resolve(res.data.fullDesc);
          })
      });
    }
}

}
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context:{pubsub} });
server.start(() => console.log('Server is running on localhost:4000'));