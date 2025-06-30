import React from "react";

export default function AboutCreditsPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4 text-indigo-700">About Credits</h1>
      <p className="mb-4 text-gray-700">
        Credits are the currency you use to access premium features and services on our platform. Each time you use certain features, a small number of credits may be deducted from your balance.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-indigo-600">How do credits work?</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Credits are required for actions like uploading files.</li>
        <li>You can always see your current credit balance at the top of the page.</li>
        <li>When you run out of credits, you’ll be prompted to purchase more to continue using premium features.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-indigo-600">How can I get more credits?</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Click the <span className="font-medium">Buy More Credits</span> button anywhere you see it, or visit the <a href="/buy" className="text-indigo-600 underline">Buy Credits</a> page.</li>
        <li>Choose a credit pack that fits your needs and follow the checkout process.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-indigo-600">Need help?</h2>
      <p className="mb-4 text-gray-700">
        If you have questions about credits or need assistance, please contact our support team.
      </p>
    </div>
  );
}
