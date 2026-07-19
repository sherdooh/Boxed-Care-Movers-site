import { useState, useEffect, useRef } from "react";
import {
  Send,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Save,
  RefreshCw,
} from "lucide-react";
import { SiteContent, LeadEntry } from "../../lib/siteContent";
import { postLead } from "../../lib/api";
import { formatQuoteNumber } from "../../lib/quoteUtils";

const STORAGE_KEY = "boxed_quote_draft";
const DRAFT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface FormData {
  name: string;
  email: string;
  phone: string;
  from_location: string;
  to_location: string;
  current_floor: string;
  destination_floor: string;
  current_size: string;
  destination_size: string;
  move_date: string;
  move_type: string;
  message: string;
}

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  from_location: "",
  to_location: "",
  current_floor: "",
  destination_floor: "",
  current_size: "",
  destination_size: "",
  move_date: "",
  move_type: "",
  message: "",
};

// ============================================================
// FIELD VALIDATION
// ============================================================
const validateField = (name: string, value: string): string => {
  if (!value.trim()) return "";

  switch (name) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? ""
        : "Please enter a valid email address";
    case "phone":
      return /^(?:\+254|0)[17]\d{8}$/.test(value.replace(/\s/g, ""))
        ? ""
        : "Enter a valid Kenyan phone (e.g., 0712345678)";
    case "name":
      return value.length >= 2 ? "" : "Name must be at least 2 characters";
    case "from_location":
    case "to_location":
      return value.length >= 2 ? "" : "Please enter a valid location";
    default:
      return "";
  }
};

interface QuoteFormProps {
  content: SiteContent;
}

export default function QuoteForm({ content }: QuoteFormProps) {
  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < DRAFT_EXPIRY) {
          return { ...initialForm, ...parsed.data };
        }
      }
    } catch (e) {
      /* ignore */
    }
    return initialForm;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [section, setSection] = useState<"personal" | "details">("personal");
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Check if draft exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasData = Object.values(parsed.data || {}).some(
          (v) => typeof v === "string" && v.trim() !== "",
        );
        if (hasData && Date.now() - parsed.timestamp < DRAFT_EXPIRY) {
          setShowDraftBanner(true);
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    const hasData = Object.values(form).some((v) => v && v.trim() !== "");
    if (!hasData) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data: form,
            timestamp: Date.now(),
            version: "1.0",
          }),
        );
      } catch (e) {
        /* ignore */
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields: (keyof FormData)[] = [
      "name",
      "email",
      "phone",
      "from_location",
      "to_location",
    ];

    requiredFields.forEach((field) => {
      if (!form[field] || !form[field].trim()) {
        newErrors[field] = "This field is required";
      } else {
        const error = validateField(field, form[field]);
        if (error) newErrors[field] = error;
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        (firstErrorField as HTMLElement).focus();
      }
      return;
    }

    setSubmitting(true);
    setError("");

    const subject = `Quote request from ${form.name || "a customer"}`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `From: ${form.from_location}`,
      `To: ${form.to_location}`,
      `Current floor: ${form.current_floor}`,
      `Destination floor: ${form.destination_floor}`,
      `Current home size: ${form.current_size}`,
      `Destination home size: ${form.destination_size}`,
      `Preferred move date: ${form.move_date}`,
      `Move type: ${form.move_type}`,
      `Details: ${form.message}`,
    ];

    const body = bodyLines.join("\n");
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:${content.email}?subject=${encodeURIComponent(subject)}&body=${encodedBody}`;
    const whatsappPhone = content.phone.replace(/\D+/g, "");
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedBody}`;

    const submissionDate = new Date().toISOString().slice(0, 10);
    const newLeadId = formatQuoteNumber(submissionDate, `${Date.now()}`);
    const lead: LeadEntry = {
      id: newLeadId,
      date: new Date().toLocaleString(),
      ...form,
      quoteNumber: newLeadId,
    };

    try {
      await postLead(lead);
      localStorage.removeItem(STORAGE_KEY);
      setShowDraftBanner(false);
    } catch (error) {
      console.error("Quote request save failed", error);
      setError(
        "Unable to save your quote request. Please try again in a moment.",
      );
      setSubmitting(false);
      return;
    }

    window.open(whatsappUrl, "_blank");
    window.location.href = mailtoUrl;

    setSubmitted(true);
    setForm(initialForm);
    setSubmitting(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm(initialForm);
    setShowDraftBanner(false);
  };

  // Calculate progress
  const totalFields = 11;
  const filledFields = Object.values(form).filter(
    (v) => v && v.trim() !== "",
  ).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  // ============================================================
  // RENDER
  // ============================================================
  if (submitted) {
    return (
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto bg-gray-50 rounded-3xl p-12 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Quote Request Sent! 🎉
            </h3>
            <p className="text-gray-500 mb-6">
              Thank you for reaching out. Our team will contact you within 2
              hours with a customized quote.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left side (contact info) – hidden for brevity */}
        <div className="lg:col-span-3 col-span-1">
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            {/* Draft banner */}
            {showDraftBanner && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <Save className="w-4 h-4" />
                  <span className="text-sm">
                    💾 You have a saved draft from{" "}
                    {new Date(
                      JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
                        .timestamp,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDraftBanner(false)}
                    className="text-sm text-amber-600 font-semibold hover:underline"
                  >
                    Continue
                  </button>
                  <button
                    onClick={discardDraft}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Form progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ============================================================
              FORM — ALL FIELDS INCLUDED
              ============================================================ */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Section toggle (optional) */}
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setSection("personal")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    section === "personal"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Personal Info
                </button>
                <button
                  type="button"
                  onClick={() => setSection("details")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    section === "details"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Move Details
                </button>
              </div>

              <div className="space-y-5">
                {/* SECTION: Personal Info */}
                {section === "personal" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={firstFieldRef}
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="e.g. John Kamau"
                          data-error={errors.name ? "true" : "false"}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            errors.name && touched.name
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition`}
                        />
                        {errors.name && touched.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="0712345678"
                          data-error={errors.phone ? "true" : "false"}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            errors.phone && touched.phone
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition`}
                        />
                        {errors.phone && touched.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="john@email.com"
                        data-error={errors.email ? "true" : "false"}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.email && touched.email
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 bg-white"
                        } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition`}
                      />
                      {errors.email && touched.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION: Move Details */}
                {section === "details" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Moving From <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="from_location"
                          value={form.from_location}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="e.g. Nairobi"
                          data-error={errors.from_location ? "true" : "false"}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            errors.from_location && touched.from_location
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition`}
                        />
                        {errors.from_location && touched.from_location && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.from_location}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Moving To <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="to_location"
                          value={form.to_location}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="e.g. Mombasa"
                          data-error={errors.to_location ? "true" : "false"}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            errors.to_location && touched.to_location
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition`}
                        />
                        {errors.to_location && touched.to_location && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.to_location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Current Floor
                        </label>
                        <select
                          name="current_floor"
                          value={form.current_floor}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                          <option value="">Select floor...</option>
                          <option value="Ground floor">Ground floor</option>
                          <option value="1st floor">1st floor</option>
                          <option value="2nd floor">2nd floor</option>
                          <option value="3rd floor">3rd floor</option>
                          <option value="4th floor">4th floor</option>
                          <option value="5th floor">5th floor</option>
                          <option value="6th floor">6th floor</option>
                          <option value="7th floor">7th floor</option>
                          <option value="8th floor">8th floor</option>
                          <option value="9th floor">9th floor</option>
                          <option value="10+ floors">10+ floors</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Destination Floor
                        </label>
                        <select
                          name="destination_floor"
                          value={form.destination_floor}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                          <option value="">Select floor...</option>
                          <option value="Ground floor">Ground floor</option>
                          <option value="1st floor">1st floor</option>
                          <option value="2nd floor">2nd floor</option>
                          <option value="3rd floor">3rd floor</option>
                          <option value="4th floor">4th floor</option>
                          <option value="5th floor">5th floor</option>
                          <option value="6th floor">6th floor</option>
                          <option value="7th floor">7th floor</option>
                          <option value="8th floor">8th floor</option>
                          <option value="9th floor">9th floor</option>
                          <option value="10+ floors">10+ floors</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Current House Size
                        </label>
                        <select
                          name="current_size"
                          value={form.current_size}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                          <option value="">Select size...</option>
                          <option value="Studio">Studio</option>
                          <option value="Bedsitter">Bedsitter</option>
                          <option value="1 bedroom">1 bedroom</option>
                          <option value="2 bedroom">2 bedroom</option>
                          <option value="3 bedroom">3 bedroom</option>
                          <option value="4 bedroom">4 bedroom</option>
                          <option value="5 bedroom">5 bedroom</option>
                          <option value="6+ bedroom">6+ bedroom</option>
                          <option value="Townhouse">Townhouse</option>
                          <option value="Villa">Villa</option>
                          <option value="Apartment">Apartment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Destination House Size
                        </label>
                        <select
                          name="destination_size"
                          value={form.destination_size}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                          <option value="">Select size...</option>
                          <option value="Studio">Studio</option>
                          <option value="Bedsitter">Bedsitter</option>
                          <option value="1 bedroom">1 bedroom</option>
                          <option value="2 bedroom">2 bedroom</option>
                          <option value="3 bedroom">3 bedroom</option>
                          <option value="4 bedroom">4 bedroom</option>
                          <option value="5 bedroom">5 bedroom</option>
                          <option value="6+ bedroom">6+ bedroom</option>
                          <option value="Townhouse">Townhouse</option>
                          <option value="Villa">Villa</option>
                          <option value="Apartment">Apartment</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Preferred Move Date
                        </label>
                        <input
                          type="date"
                          name="move_date"
                          value={form.move_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Type of Move
                        </label>
                        <select
                          name="move_type"
                          value={form.move_type}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                          <option value="">Select type...</option>
                          <option value="Residential Moving">
                            Residential Moving
                          </option>
                          <option value="Office & Commercial">
                            Office & Commercial
                          </option>
                          <option value="Professional Packing">
                            Professional Packing
                          </option>
                          <option value="Long-Distance Moving">
                            Long-Distance Moving
                          </option>
                          <option value="Storage Solutions">
                            Storage Solutions
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Additional Details
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows={4}
                        placeholder="Tell us about special items, access requirements, or anything else we should know..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mt-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors shadow-md mt-4"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Request Free Quote
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
