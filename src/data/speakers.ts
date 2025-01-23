interface Speaker {
  id: string;
  name: string;
  position: string;
  photoUrl?: string;
}

export const SPEAKERS: Record<string, Speaker> = {
  'klochkova': {
    id: 'klochkova',
    name: 'Татьяна Клочкова',
    position: 'Начальник ОКРиКС',
    photoUrl: 'https://static.tildacdn.com/tild3732-3230-4534-b165-303035636334/noroot.png'
  },
  'morozov': {
    id: 'morozov',
    name: 'Михаил Морозов',
    position: 'Бизнес тренер ООКРиКС',
    photoUrl: 'https://static.tildacdn.com/tild6532-6638-4664-b431-653261303664/photo.png'
  },
  'katyurina': {
    id: 'katyurina',
    name: 'Дарья Катюрина',
    position: 'Ведущий бизнес-тренер ООТПиЛР',
    photoUrl: 'https://static.tildacdn.com/tild3565-3461-4831-a263-646266623833/noroot.png'
  },
  'korotkova': {
    id: 'korotkova',
    name: 'Ирина Короткова',
    position: 'Бизнес тренер ООКРиКС',
    photoUrl: 'https://static.tildacdn.com/tild3163-6566-4163-b564-616438396238/__2.jpg'
  },
  'seredin': {
    id: 'seredin',
    name: 'Середин А',
    position: 'Тренер СПП СНС-Экспресс',
    photoUrl: 'https://static.tildacdn.com/tild3964-3739-4564-a635-623061633738/_1ddd4x.png'
  },
  'sokolyanskaya': {
    id: 'sokolyanskaya',
    name: 'Соколянская Татьяна',
    position: 'Директор ДОиРП',
    photoUrl: 'https://static.tildacdn.com/tild3930-3437-4235-b038-663264633966/99a75d97-9fec-4267-b.jpg'
  },
  'temnov': {
    id: 'temnov',
    name: 'Темнов Георгий',
    position: 'Начальник ООТПиЛР',
    photoUrl: 'https://static.tildacdn.com/tild6564-3162-4639-b365-663335303933/_874x.png'
  }, // Исправленная строка
  'uhova': {
    id: 'uhova',
    name: 'Ухова Екатерина',
    position: 'Начальник ОДОП', // Исправленная строка
    photoUrl: 'https://static.tildacdn.com/tild3937-3138-4837-a536-356366646439/17_012g.jpg'
  }, // Исправленная строка
  'sannikova': {
    id: 'sannikova',
    name: 'Санникова Оксана',
    position: 'Менеджер ОВОиОМР',
    photoUrl: 'https://static.tildacdn.com/tild6463-6566-4733-b937-636663333733/___2.jpg'
  }
};
