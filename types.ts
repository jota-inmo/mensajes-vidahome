export interface MessageTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  language: string;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
}

export interface Property {
  id: string;
  ref: string;
  title: string;
  zone: string;
  city: string;
  link: string;
  imageUrl?: string;
}

export interface Client {
  name: string;
  phone: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
}
