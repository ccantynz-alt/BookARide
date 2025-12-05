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
      },
      email: {
        subject: 'Booking Confirmation',
        greeting: 'Dear',
        confirmed: 'Your ride has been confirmed!',
        details: 'Booking Details',
        reference: 'Booking Reference',
        service: 'Service Type',
        pickup: 'Pickup',
        dropoff: 'Drop-off',
        date: 'Date',
        time: 'Time',
        passengers: 'Passengers',
        totalPaid: 'Total Paid',
        contact: 'If you have any questions, please contact us at',
        thanks: 'Thank you for choosing BookaRide!',
        footer: 'BookaRide NZ'
      },
      sms: {
        confirmed: 'BookaRide: Your ride is confirmed!',
        details: 'Ref: {{ref}}, {{date}} at {{time}}. Pickup: {{pickup}}. Total: ${{price}}. Thank you!'
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
      },
      email: {
        subject: '预订确认',
        greeting: '尊敬的',
        confirmed: '您的行程已确认！',
        details: '预订详情',
        reference: '预订编号',
        service: '服务类型',
        pickup: '上车地点',
        dropoff: '下车地点',
        date: '日期',
        time: '时间',
        passengers: '乘客人数',
        totalPaid: '总费用',
        contact: '如有任何问题，请联系我们',
        thanks: '感谢您选择BookaRide！',
        footer: 'BookaRide 新西兰'
      },
      sms: {
        confirmed: 'BookaRide：您的行程已确认！',
        details: '编号：{{ref}}，{{date}} {{time}}。上车：{{pickup}}。费用：${{price}}。谢谢！'
      }
    }
  },
  ja: {
    translation: {
      nav: {
        home: 'ホーム',
        services: 'サービス',
        about: '会社概要',
        contact: '今すぐ予約'
      },
      hero: {
        title: '格安空港シャトル',
        subtitle: 'オークランド最高のバリュー',
        description: '信頼できる空港送迎サービスを破格の価格で。即時オンライン予約、透明な料金設定、プロフェッショナルなサービス - わずか60秒。',
        bookNow: '今すぐ予約',
        viewServices: 'サービスを見る'
      },
      stats: {
        customers: '満足したお客様',
        bookingTime: '秒で予約',
        safety: '安全で保険付き',
        rating: '顧客評価'
      },
      services: {
        title: '私たちのサービス',
        description: 'あらゆる交通ニーズに対応します'
      },
      testimonials: {
        title: 'お客様の声',
        description: '私たちの言葉だけでなく、満足したお客様の声をお聞きください'
      },
      footer: {
        company: '会社',
        services: 'サービス',
        legal: '法的情報',
        rights: '全著作権所有。'
      },
      email: {
        subject: '予約確認',
        greeting: '様',
        confirmed: 'ご予約が確定しました！',
        details: '予約詳細',
        reference: '予約番号',
        service: 'サービスタイプ',
        pickup: '乗車場所',
        dropoff: '降車場所',
        date: '日付',
        time: '時間',
        passengers: '乗客数',
        totalPaid: '合計金額',
        contact: 'ご質問がございましたら、お問い合わせください',
        thanks: 'BookaRideをご利用いただきありがとうございます！',
        footer: 'BookaRide ニュージーランド'
      },
      sms: {
        confirmed: 'BookaRide：予約が確定しました！',
        details: '予約番号：{{ref}}、{{date}} {{time}}。乗車：{{pickup}}。料金：${{price}}。ありがとうございます！'
      }
    }
  },
  ko: {
    translation: {
      nav: {
        home: '홈',
        services: '서비스',
        about: '회사 소개',
        contact: '지금 예약'
      },
      hero: {
        title: '저렴한 공항 셔틀',
        subtitle: '오클랜드 최고의 가치',
        description: '믿을 수 있는 공항 이동 서비스를 합리적인 가격으로. 즉시 온라인 예약, 투명한 가격, 전문적인 서비스 - 단 60초 만에.',
        bookNow: '지금 예약하기',
        viewServices: '서비스 보기'
      },
      stats: {
        customers: '만족한 고객',
        bookingTime: '초 만에 예약',
        safety: '안전 및 보험',
        rating: '고객 평가'
      },
      services: {
        title: '우리의 서비스',
        description: '어떤 교통 수요든 저희가 해결해 드립니다'
      },
      testimonials: {
        title: '고객 후기',
        description: '저희 말만 믿지 마시고 만족한 고객들의 목소리를 들어보세요'
      },
      footer: {
        company: '회사',
        services: '서비스',
        legal: '법적 정보',
        rights: '모든 권리 보유.'
      },
      email: {
        subject: '예약 확인',
        greeting: '고객님께',
        confirmed: '예약이 확정되었습니다!',
        details: '예약 상세 정보',
        reference: '예약 번호',
        service: '서비스 유형',
        pickup: '탑승 위치',
        dropoff: '하차 위치',
        date: '날짜',
        time: '시간',
        passengers: '승객 수',
        totalPaid: '총 결제 금액',
        contact: '문의사항이 있으시면 연락주세요',
        thanks: 'BookaRide를 이용해 주셔서 감사합니다!',
        footer: 'BookaRide 뉴질랜드'
      },
      sms: {
        confirmed: 'BookaRide: 예약이 확정되었습니다!',
        details: '예약번호: {{ref}}, {{date}} {{time}}. 탑승: {{pickup}}. 금액: ${{price}}. 감사합니다!'
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: 'Accueil',
        services: 'Services',
        about: 'À propos',
        contact: 'Réserver'
      },
      hero: {
        title: 'Navettes Aéroport Abordables',
        subtitle: 'Meilleur Rapport Qualité-Prix à Auckland',
        description: 'Transferts aéroport fiables à des prix imbattables. Réservation en ligne instantanée, tarifs transparents et service professionnel - en 60 secondes.',
        bookNow: 'Réserver Votre Trajet',
        viewServices: 'Voir les Services'
      },
      stats: {
        customers: 'Clients Satisfaits',
        bookingTime: 'Réservation en Secondes',
        safety: 'Sûr et Assuré',
        rating: 'Note Client'
      },
      services: {
        title: 'Nos Services',
        description: 'Quels que soient vos besoins de transport, nous vous couvrons'
      },
      testimonials: {
        title: 'Ce Que Disent Nos Clients',
        description: 'Ne nous croyez pas sur parole - écoutez nos clients satisfaits'
      },
      footer: {
        company: 'Entreprise',
        services: 'Services',
        legal: 'Légal',
        rights: 'Tous droits réservés.'
      },
      email: {
        subject: 'Confirmation de Réservation',
        greeting: 'Cher',
        confirmed: 'Votre trajet a été confirmé!',
        details: 'Détails de la Réservation',
        reference: 'Référence de Réservation',
        service: 'Type de Service',
        pickup: 'Lieu de Prise en Charge',
        dropoff: 'Lieu de Dépose',
        date: 'Date',
        time: 'Heure',
        passengers: 'Passagers',
        totalPaid: 'Total Payé',
        contact: 'Pour toute question, veuillez nous contacter à',
        thanks: 'Merci d\'avoir choisi BookaRide!',
        footer: 'BookaRide Nouvelle-Zélande'
      },
      sms: {
        confirmed: 'BookaRide: Votre trajet est confirmé!',
        details: 'Réf: {{ref}}, {{date}} à {{time}}. Prise en charge: {{pickup}}. Total: ${{price}}. Merci!'
      }
    }
  },
  hi: {
    translation: {
      nav: {
        home: 'होम',
        services: 'सेवाएं',
        about: 'हमारे बारे में',
        contact: 'अभी बुक करें'
      },
      hero: {
        title: 'किफायती एयरपोर्ट शटल',
        subtitle: 'ऑकलैंड में सर्वश्रेष्ठ मूल्य',
        description: 'बेजोड़ कीमतों पर विश्वसनीय एयरपोर्ट ट्रांसफर। तत्काल ऑनलाइन बुकिंग, पारदर्शी मूल्य निर्धारण, और पेशेवर सेवा - केवल 60 सेकंड में।',
        bookNow: 'अपनी राइड बुक करें',
        viewServices: 'सेवाएं देखें'
      },
      stats: {
        customers: 'खुश ग्राहक',
        bookingTime: 'सेकंड में बुकिंग',
        safety: 'सुरक्षित और बीमित',
        rating: 'ग्राहक रेटिंग'
      },
      services: {
        title: 'हमारी सेवाएं',
        description: 'आपकी परिवहन आवश्यकताएं जो भी हों, हमने आपको कवर किया है'
      },
      testimonials: {
        title: 'हमारे ग्राहक क्या कहते हैं',
        description: 'केवल हमारी बात न मानें - हमारे संतुष्ट ग्राहकों से सुनें'
      },
      footer: {
        company: 'कंपनी',
        services: 'सेवाएं',
        legal: 'कानूनी',
        rights: 'सर्वाधिकार सुरक्षित।'
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