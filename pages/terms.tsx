import { NextPage } from "next";
import Link from "next/link";
import { ChevronLeft } from "react-feather";

const TermsPage: NextPage = () => {
  return (
    <div className="container-fluid py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-sky-600 transition-colors hover:text-sky-500"
      >
        <ChevronLeft size={16} />
        Back to Home
      </Link>

      {/* Content */}
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-lg md:p-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Terms & Legal Information
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Legal Disclaimer
            </h2>
            <p>
              Please be advised that Equipoise Corp. d/b/a Zeitgeist is
              registered under the laws of Panama, and Zeitgeist has not sought
              licensing with any other regulatory authority of any country or
              jurisdiction, nor has any such regulatory authority passed upon or
              endorsed the merits of the financial products offered by
              Zeitgeist.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Regulated Jurisdictions
            </h2>
            <p>
              Zeitgeist does not accept clients from the United States and other
              similar jurisdictions where regulations prohibit Zeitgeist from
              offering its financial products ("Regulated Jurisdictions").
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Usage Restrictions
            </h2>
            <p>
              While this website may be accessed worldwide, the information
              provided is only intended for use by any person in any country
              where such use would not be contrary to local law or regulation.
            </p>
            <p className="mt-3">
              Browsers from Regulated Jurisdictions are specifically prohibited
              from using this site.
            </p>
          </section>

          <section className="mt-8 rounded-lg bg-sky-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> By using this website and its services, you
              acknowledge that you have read, understood, and agree to be bound
              by these terms.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
