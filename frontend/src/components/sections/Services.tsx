import {
  Home,
  Building2,
  Package,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { SiteContent } from "../../lib/siteContent";

const serviceMetadata = [
  {
    icon: Home,
    title: "Residential Moving",
    description:
      "Smooth, stress-free home relocations whether you are moving across town or across the region. We handle everything with personal care.",
  },
  {
    icon: Building2,
    title: "Office & Commercial",
    description:
      "Minimise downtime with our efficient office relocation services. We plan every detail so your business keeps moving forward.",
  },
  {
    icon: Package,
    title: "Professional Packing",
    description:
      "Our skilled team uses quality materials to pack fragile, bulky, and valuable items so they arrive exactly as they left.",
  },
  {
    icon: Truck,
    title: "Long-Distance Moving",
    description:
      "Reliable long-distance moving with GPS-tracked transport. Your belongings arrive safely and on schedule, no matter where you are headed.",
  },
  {
    icon: Warehouse,
    title: "Storage Solutions",
    description:
      "Secure, climate-appropriate storage facilities available for short or long-term needs during your transition period.",
  },
  {
    icon: Wrench,
    title: "Furniture Assembly",
    description:
      "Disassembly and reassembly of furniture handled by experienced technicians — so you can settle in without the hassle.",
  },
];

interface ServicesProps {
  content?: SiteContent;
}

export default function Services({ content }: ServicesProps) {
  const services = serviceMetadata.map((meta, index) => ({
    ...meta,
    image:
      content?.serviceImages[index] ||
      "https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=600",
  }));

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-amber-600 font-semibold text-sm tracking-wider uppercase mb-3">
            What We Offer
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From a single box to a full office fit-out, we have the expertise,
            vehicles, and team to handle any move with precision and care.
          </p>
        </div>

        {/* Grid - Desktop */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <div className="p-2 bg-amber-500 rounded-lg shadow">
                    <service.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="sm:hidden overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-6 min-w-max">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 shrink-0 w-80"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <div className="p-2 bg-amber-500 rounded-lg shadow">
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg transition-colors shadow-md hover:shadow-lg"
          >
            Request a Free Quote
          </a>
        </div>
      </div>
    </section>
  );
}
