import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const FranceLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Transferts Aéroport pour Visiteurs Français en Nouvelle-Zélande | NZ Airport Transfers for French Visitors"
        description="Service premium de transfert aéroport pour les touristes français en Nouvelle-Zélande. Transferts fiables depuis Auckland & Hamilton. Paiements en EUR acceptés. Premium airport shuttle for French tourists visiting New Zealand."
        keywords="Visiteurs français Nouvelle-Zélande, transfert aéroport NZ France, navette aéroport Auckland, transport vacances NZ, French visitors NZ"
        canonical="/visitors/france"
        currentLang="fr"
      />

      {/* Hero Section with Beautiful France Image */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-900 via-white to-red-700 overflow-hidden">
        {/* Eiffel Tower Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80" 
            alt="Paris Eiffel Tower" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-black/50 to-red-900/60" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇫🇷</span>
              <span className="text-white font-medium">Bienvenue visiteurs français!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Votre aventure NZ <span className="text-gold">commence ici</span>
            </h1>
            <p className="text-xl text-white/90 mb-4">
              Your New Zealand Adventure Starts Here
            </p>
            <p className="text-lg text-white/80 mb-8">
              Service de transfert aéroport fiable à travers la Nouvelle-Zélande
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/fr/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Réserver maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Pourquoi nous choisir?</h2>
          <p className="text-center text-gray-600 mb-12">Why French Visitors Choose Us</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ponctualité</h3>
              <p className="text-sm text-gray-600">Punctuality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sécurité</h3>
              <p className="text-sm text-gray-600">Safety</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Qualité</h3>
              <p className="text-sm text-gray-600">Quality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Paiement EUR</h3>
              <p className="text-sm text-gray-600">EUR Payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Destinations populaires</h2>
          <p className="text-center text-gray-600 mb-12">Popular Destinations</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Hobbiton', desc: 'Lieu de tournage du Seigneur des Anneaux', price: 'Demander un devis' },
              { name: 'Rotorua', desc: 'Merveilles géothermiques', price: 'Demander un devis' },
              { name: 'Auckland CBD', desc: 'Hôtels du centre-ville', price: 'Devis gratuit' },
            ].map((dest, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{dest.name}</h3>
                <p className="text-gray-600 mb-4">{dest.desc}</p>
                <p className="text-gold font-bold">{dest.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-2">Prêt à réserver?</h2>
          <p className="text-xl text-black/80 mb-8">Ready to Book?</p>
          <Link to="/fr/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              Réserver maintenant →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default FranceLanding;
