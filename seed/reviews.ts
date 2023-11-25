import {MovieReview} from '../shared/types'

export const movieReviews : MovieReview[] = [
  {
    movieId: 101,
    reviewerId: 'user123',
    reviewDate: '2023-11-01',
    content: 'A thrilling adventure with stunning visuals and a gripping storyline.',
    rating: 5
  },
  {
    movieId: 101,
    reviewerId: 'user456',
    reviewDate: '2023-10-01',
    content: 'Very cool.',
    rating: 3
  },
  {
    movieId: 101,
    reviewerId: 'user789',
    reviewDate: '2023-09-01',
    content: 'Probably the worst movie of all time. Absolutely diabolical.',
    rating: 1
  },
  {
    movieId: 102,
    reviewerId: 'user456',
    reviewDate: '2023-11-02',
    content: 'An emotional journey with powerful performances and a memorable soundtrack.',
    rating: 4
  },
  {
    movieId: 103,
    reviewerId: 'user789',
    reviewDate: '2023-11-03',
    content: 'A unique and thought-provoking film that challenges conventions.',
    rating: 4.5
  }
];