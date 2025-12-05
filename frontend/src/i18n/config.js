import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        services: 'Services',
        about: 'About',
        contact: 'Book Now'
      },
      hero: {
        title: 'Affordable Airport Shuttles',
        subtitle: 'Best Value in Auckland',
        description: 'Reliable airport transfers at unbeatable prices. Instant online booking, transparent pricing, and professional service - all in 60 seconds.',
        bookNow: 'Book Your Ride',
        viewServices: 'View Services'
      },
      stats: {
        customers: 'Happy Customers',
        bookingTime: 'Book in Seconds',
        safety: 'Safe & Insured',
        rating: 'Customer Rating'
      },
      services: {
        title: 'Our Services',
        description: 'Whatever your transportation needs, we\'ve got you covered'
      },
      testimonials: {
        title: 'What Our Customers Say',
        description: 'Don\'t just take our word for it - hear from our satisfied customers'
      },
      footer: {
        company: 'Company',
        services: 'Services',
        legal: 'Legal',
        rights: 'All rights reserved.'
      }
    }
  },
  zh: {
    translation: {
      nav: {
        home: '首页',
        services: '服务',
        about: '关于',
        contact: '立即预订'
      },
      hero: {
        title: '实惠的机场班车',
        subtitle: '奥克兰最佳性价比',
        description: '可靠的机场接送服务，价格实惠。即时在线预订，透明定价，专业服务 - 只需60秒。',
        bookNow: '立即预订',
        viewServices: '查看服务'
      },
      stats: {
        customers: '满意客户',
        bookingTime: '快速预订',
        safety: '安全保障',
        rating: '客户评分'
      },
      services: {
        title: '我们的服务',
        description: '无论您的交通需求如何，我们都能满足您'
      },
      testimonials: {
        title: '客户评价',
        description: '不要只听我们说 - 听听我们满意客户的声音'
      },
      footer: {
        company: '公司',
        services: '服务',
        legal: '法律',
        rights: '版权所有。'
      }
    }
  },
  es: {
    translation: {
      nav: {
        home: 'Inicio',
        services: 'Servicios',
        about: 'Acerca de',
        contact: 'Reservar Ahora'
      },
      hero: {
        title: 'Transporte Económico al Aeropuerto',
        subtitle: 'Mejor Valor en Auckland',
        description: 'Traslados aeroportuarios confiables a precios inmejorables. Reserva en línea instantánea, precios transparentes y servicio profesional - todo en 60 segundos.',
        bookNow: 'Reservar Viaje',
        viewServices: 'Ver Servicios'
      },
      stats: {
        customers: 'Clientes Felices',
        bookingTime: 'Reserva en Segundos',
        safety: 'Seguro y Protegido',
        rating: 'Calificación'
      },
      services: {
        title: 'Nuestros Servicios',
        description: 'Cualesquiera que sean sus necesidades de transporte, lo tenemos cubierto'
      },
      testimonials: {
        title: 'Lo Que Dicen Nuestros Clientes',
        description: 'No solo nos creas a nosotros - escucha a nuestros clientes satisfechos'
      },
      footer: {
        company: 'Empresa',
        services: 'Servicios',
        legal: 'Legal',
        rights: 'Todos los derechos reservados.'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;