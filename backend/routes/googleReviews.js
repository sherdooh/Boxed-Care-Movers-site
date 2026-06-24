const express = require('express');
const router = express.Router();

/**
 * GET /api/google-reviews
 * Returns realistic Kenyan reviews for the testimonials slider.
 * Replace this with a real Google Places API call when you have an API key.
 */
router.get('/', async (req, res, next) => {
  try {
    // Realistic Kenyan reviews for a moving company
    const reviews = [
      {
        id: '1',
        authorName: 'Grace Wanjiru',
        rating: 5,
        text: 'The team arrived on time and handled my furniture with extreme care. They wrapped everything and even helped me arrange items at the new house. Highly recommend!',
        relativeTimeDescription: '2 weeks ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/3778610/pexels-photo-3778610.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '2',
        authorName: 'Peter Ochieng',
        rating: 5,
        text: 'Professional from start to finish. They gave a clear quote, no hidden charges, and the move was completed in record time. Stress‑free experience!',
        relativeTimeDescription: '1 month ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '3',
        authorName: 'Faith Akinyi',
        rating: 4,
        text: 'Very careful with my fragile items – nothing broken. The crew was polite and efficient. Only small delay due to traffic, but they communicated well.',
        relativeTimeDescription: '3 weeks ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '4',
        authorName: 'David Kiprono',
        rating: 5,
        text: 'I moved my office equipment from Nairobi to Eldoret. They handled everything professionally, including heavy desks and computers. Will definitely use again.',
        relativeTimeDescription: '2 months ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '5',
        authorName: 'Susan Muthoni',
        rating: 5,
        text: 'Best moving experience I\'ve ever had. They came with all the packing materials and even helped me pack my kitchen. Affordable and reliable!',
        relativeTimeDescription: '1 week ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '6',
        authorName: 'James Njoroge',
        rating: 4,
        text: 'Good service overall. The truck was clean and the movers were respectful. Slight issue with the elevator access, but they managed well.',
        relativeTimeDescription: '2 months ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '7',
        authorName: 'Catherine Wambui',
        rating: 5,
        text: 'I was anxious about moving my piano, but the team handled it like pros. Everything arrived perfectly. Highly recommended for delicate items.',
        relativeTimeDescription: '3 weeks ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '8',
        authorName: 'Robert Odhiambo',
        rating: 5,
        text: 'Excellent communication from the booking stage to the final drop‑off. They even helped me set up my bed at the new apartment. Top‑notch service!',
        relativeTimeDescription: '1 month ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '9',
        authorName: 'Mary Akoth',
        rating: 5,
        text: 'They moved my 3-bedroom house from Nairobi to Kisumu. Everything arrived in perfect condition. The team was friendly, fast, and very professional.',
        relativeTimeDescription: '3 months ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
      {
        id: '10',
        authorName: 'Samuel Kariuki',
        rating: 5,
        text: 'I was impressed by their attention to detail. They labelled every box and even took photos of fragile items before loading. Absolutely stress-free.',
        relativeTimeDescription: '2 weeks ago',
        profilePhotoUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
        authorUrl: '#',
      },
    ];

    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

module.exports = router;