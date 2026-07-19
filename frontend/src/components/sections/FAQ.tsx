import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'How much does it cost to move a house in Nairobi?',
    answer:
      'Moving costs depend on two main factors: your house size and the distance travelled. For local moves within Nairobi, a bedsitter typically costs KSh 17,000–20,000, a 1-bedroom KSh 18,000–25,000, and a 2-bedroom KSh 25,000–40,000. For intercounty moves (e.g., Nairobi to Mombasa, Kisumu, or Nakuru), prices are higher due to distance, fuel, and time. Additional factors like floor access, stairs, parking availability, and special items also affect the final cost. Contact us for a free, no-obligation quote based on your exact move details.',
  },
  {
    question: 'Do you provide packing materials and boxes?',
    answer:
      'Yes. We provide all packing materials including boxes, bubble wrap, stretch wrap, and protective covers. Our team handles everything so your belongings are safe during transit — you don\'t need to source anything yourself.',
  },
  {
    question: 'How far in advance should I book a mover in Nairobi?',
    answer:
      'We recommend booking at least 3–5 days ahead for local moves, and 1–2 weeks for long-distance or office relocations. Same-day and next-day moves may be available — call us at +254 748 851 679 to check.',
  },
  {
    question: 'Do you move outside Nairobi?',
    answer:
      'Yes. We offer nationwide moving services across Kenya including Mombasa, Kisumu, Nakuru, Eldoret, Thika, and all other counties. Get in touch for a long-distance quote.',
  },
  {
    question: 'Is a deposit required to confirm a booking?',
    answer:
      'A 30% deposit is required to confirm your booking date. The remaining balance is due immediately upon successful completion of the move. We accept cash, M-Pesa, and bank transfer.',
  },
  {
    question: 'What happens if something gets damaged during the move?',
    answer:
      'We handle all items with professional care and quality packing materials. We strongly recommend declaring any fragile or high-value items before moving day so we can give them the attention they deserve.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-12" data-aos="fade-up">
          <p className="text-sm font-semibold text-amber-600 tracking-wider uppercase mb-2">
            Got questions?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Everything you need to know before booking your move in Nairobi.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3" data-aos="fade-up" data-aos-delay="100">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-semibold text-gray-900 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-500 shrink-0 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Answer — animated open/close */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA below */}
        <div className="mt-10 text-center" data-aos="fade-up" data-aos-delay="200">
          <p className="text-gray-500 text-sm mb-4">
            Still have questions? We're happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* ✅ Fixed: added missing <a> tags */}
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get a free quote
            </a>
            <a
              href="tel:+254748851679"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-amber-400 text-gray-700 hover:text-amber-600 text-sm font-semibold rounded-lg transition-colors"
            >
              Call +254 748 851 679
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}