import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Clock, User, Mail, Scissors, MapPin, ChevronRight, PartyPopper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getBarbershops, getServices, getBarbers, getAvailableSlots,
  createAppointment, createUser, getUser, Barbershop, Service, Barber 
} from '@/lib/storage';

type Step = 'shop' | 'service' | 'barber' | 'date' | 'time' | 'email' | 'summary' | 'done';

const ClientBooking = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('shop');
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientName, setClientName] = useState(user?.name || '');
  const [messages, setMessages] = useState<Array<{ type: 'bot' | 'user'; text: string }>>([
    { type: 'bot', text: 'Olá! 👋 Bem-vindo ao BarberPro. Vamos agendar seu serviço. Escolha uma barbearia:' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'bot' | 'user', text: string) => {
    setMessages(prev => [...prev, { type, text }]);
  };

  const shops = getBarbershops();
  const services = selectedShop ? getServices(selectedShop.id).filter(s => s.active) : [];
  const barbers = selectedShop ? getBarbers(selectedShop.id) : [];

  const getNext7Days = () => {
    const days: { date: string; label: string; dayOfWeek: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue; // Sunday blocked
      if (selectedShop && !selectedShop.workingDays.includes(dayOfWeek)) continue;
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
      days.push({ date: iso, label, dayOfWeek });
      if (days.length >= 7) break;
    }
    return days;
  };

  const availableSlots = selectedShop && selectedBarber && selectedDate && selectedService
    ? getAvailableSlots(selectedShop.id, selectedBarber.id, selectedDate, selectedService.duration)
    : [];

  const handleSelectShop = (shop: Barbershop) => {
    setSelectedShop(shop);
    addMessage('user', shop.name);
    setTimeout(() => {
      addMessage('bot', `Ótima escolha! 🏪 ${shop.name}. Agora escolha o serviço desejado:`);
      setStep('service');
    }, 300);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    addMessage('user', `${service.name} - R$ ${service.price}`);
    setTimeout(() => {
      addMessage('bot', `Perfeito! ✂️ ${service.name}. Escolha seu barbeiro:`);
      setStep('barber');
    }, 300);
  };

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    addMessage('user', barber.name);
    setTimeout(() => {
      addMessage('bot', `Show! 💈 ${barber.name}. Escolha a data:`);
      setStep('date');
    }, 300);
  };

  const handleSelectDate = (date: string, label: string) => {
    setSelectedDate(date);
    addMessage('user', label);
    setTimeout(() => {
      addMessage('bot', '⏰ Escolha o horário disponível:');
      setStep('time');
    }, 300);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    addMessage('user', time);
    setTimeout(() => {
      if (user?.email) {
        setClientEmail(user.email);
        setClientName(user.name);
        addMessage('bot', '📋 Confira o resumo do seu agendamento:');
        setStep('summary');
      } else {
        addMessage('bot', '📧 Para confirmar, insira seu nome e email:');
        setStep('email');
      }
    }, 300);
  };

  const handleEmailSubmit = () => {
    if (!clientEmail || !clientName) return;
    addMessage('user', `${clientName} - ${clientEmail}`);
    setTimeout(() => {
      addMessage('bot', '📋 Confira o resumo do seu agendamento:');
      setStep('summary');
    }, 300);
  };

  const handleConfirm = () => {
    if (!selectedShop || !selectedService || !selectedBarber) return;
    
    // Create client user if not exists
    if (!getUser(clientEmail)) {
      createUser({ email: clientEmail, password: '123456', name: clientName, role: 'client' });
    }

    createAppointment({
      barbershopId: selectedShop.id,
      clientEmail,
      clientName,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      date: selectedDate,
      time: selectedTime,
      duration: selectedService.duration,
      status: 'confirmed',
    });

    addMessage('user', 'Confirmar ✅');
    setStep('done');
  };

  const resetBooking = () => {
    setStep('shop');
    setSelectedShop(null);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate('');
    setSelectedTime('');
    setMessages([{ type: 'bot', text: 'Olá! 👋 Vamos agendar novamente. Escolha uma barbearia:' }]);
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={msg.type === 'bot' ? 'chatbot-bubble max-w-[85%]' : 'bg-primary/15 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]'}>
                <p className="text-sm text-foreground">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Options */}
        <AnimatePresence mode="wait">
          {step === 'shop' && shops.length > 0 && (
            <motion.div key="shop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {shops.map(shop => (
                <button key={shop.id} onClick={() => handleSelectShop(shop)} className="chatbot-option w-full text-left flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{shop.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">Plano {shop.plan}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </motion.div>
          )}

          {step === 'shop' && shops.length === 0 && (
            <motion.div key="no-shops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chatbot-bubble">
              <p className="text-sm text-muted-foreground">Nenhuma barbearia cadastrada ainda. Crie uma barbearia primeiro!</p>
            </motion.div>
          )}

          {step === 'service' && (
            <motion.div key="service" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map(service => (
                <button key={service.id} onClick={() => handleSelectService(service)} className="chatbot-option text-left">
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary font-semibold">R$ {service.price}</span>
                    <span className="text-xs text-muted-foreground">• {service.duration}min</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'barber' && (
            <motion.div key="barber" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {barbers.map(barber => (
                <button key={barber.id} onClick={() => handleSelectBarber(barber)} className="chatbot-option w-full text-left flex items-center gap-3">
                  <span className="text-2xl">{barber.avatar}</span>
                  <p className="text-sm font-medium text-foreground">{barber.name}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </motion.div>
          )}

          {step === 'date' && (
            <motion.div key="date" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {getNext7Days().map(d => (
                <button key={d.date} onClick={() => handleSelectDate(d.date, d.label)} className="chatbot-option text-center">
                  <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-foreground capitalize">{d.label}</p>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'time' && (
            <motion.div key="time" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.length > 0 ? availableSlots.map(slot => (
                <button key={slot} onClick={() => handleSelectTime(slot)} className="chatbot-option text-center">
                  <Clock className="w-3 h-3 text-primary mx-auto mb-1" />
                  <p className="text-sm font-medium text-foreground">{slot}</p>
                </button>
              )) : (
                <p className="text-sm text-muted-foreground col-span-full">Nenhum horário disponível nesta data</p>
              )}
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Seu nome"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="seu@email.com"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={handleEmailSubmit} className="w-full gold-gradient text-primary-foreground font-medium py-3 rounded-xl text-sm hover:opacity-90 transition-all">
                Continuar
              </button>
            </motion.div>
          )}

          {step === 'summary' && selectedService && selectedBarber && (
            <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4 gold-border">
              <h3 className="font-serif font-semibold text-foreground text-lg">Resumo</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{selectedShop?.name}</span></div>
                <div className="flex items-center gap-3"><Scissors className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{selectedService.name}</span></div>
                <div className="flex items-center gap-3"><User className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{selectedBarber.name}</span></div>
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{selectedTime} ({selectedService.duration}min)</span></div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{clientEmail}</span></div>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="text-xl font-bold gold-text">R$ {selectedService.price}</span>
              </div>
              <button onClick={handleConfirm} className="w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Confirmar Agendamento
              </button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center space-y-4 gold-border gold-glow">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <PartyPopper className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h3 className="font-serif text-2xl font-bold gold-text">Agendamento Confirmado!</h3>
              <p className="text-muted-foreground text-sm">Você receberá os detalhes por email.</p>
              <button onClick={resetBooking} className="gold-gradient text-primary-foreground font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
                Novo Agendamento
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ClientBooking;
