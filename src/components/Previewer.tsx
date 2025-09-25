
import React, { useState, useEffect } from 'react';
import { MessageTemplate, Property, Recipient, Agent } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { WhatsAppIcon } from './ui/Icons';
import { Textarea } from './ui/Textarea';

interface PreviewerProps {
  template: MessageTemplate | null;
  property: Property | null;
  recipient: Recipient | null;
  creatorAgent: Agent | null;
  visitingAgent: Agent | null;
  appointmentDate: string;
  appointmentTime: string;
  isLoading: boolean;
  stepNumber: number;
}

const Previewer: React.FC<PreviewerProps> = ({ 
  template, 
  property, 
  recipient, 
  creatorAgent,
  visitingAgent,
  appointmentDate, 
  appointmentTime, 
  isLoading, 
  stepNumber 
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const recipientName = recipient?.name || '';
  const recipientPhone = recipient?.phone || '';

  useEffect(() => {
    if (!template) {
      setMessage('');
      return;
    }

    let personalizedContent = template.content;
    
    // Replace recipient details
    personalizedContent = personalizedContent.replace(/\[nombre\]/gi, recipientName.trim() || '[nombre]');

    // Replace property details
    if (property) {
      personalizedContent = personalizedContent.replace(/\[ref\]/gi, property.ref || '[ref]');
      personalizedContent = personalizedContent.replace(/\[demanda\]/gi, property.link || '[demanda]');
      personalizedContent = personalizedContent.replace(/\[zona\]/gi, property.zone || '[zona]');
      personalizedContent = personalizedContent.replace(/\[ciudad\]/gi, property.city || '[ciudad]');
    }

    // Replace creator agent details
    if (creatorAgent) {
        personalizedContent = personalizedContent.replace(/\[agente_creador\]/gi, creatorAgent.name || '[agente_creador]');
    }

    // Replace visiting agent details
    if (visitingAgent) {
        personalizedContent = personalizedContent.replace(/\[agente_nombre\]/gi, visitingAgent.name || '[agente_nombre]');
        personalizedContent = personalizedContent.replace(/\[agente_tlf\]/gi, visitingAgent.phone || '[agente_tlf]');
    }

    // Replace appointment details
    if (template.content.includes('[dia]')) {
      personalizedContent = personalizedContent.replace(/\[dia\]/gi, appointmentDate || '[dia]');
    }
    if (template.content.includes('[hora]')) {
      personalizedContent = personalizedContent.replace(/\[hora\]/gi, appointmentTime || '[hora]');
    }

    setMessage(personalizedContent);

  }, [template, recipientName, property, creatorAgent, visitingAgent, appointmentDate, appointmentTime]);

  const handleSend = () => {
    setError('');
    if (!recipientPhone.trim() || !recipientName.trim()) {
        setError('El destinatario es obligatorio. Por favor, selecciónalo en el Paso 1.');
        return;
    }
     if (!property) {
        setError('Por favor, selecciona una propiedad en el Paso 2.');
        return;
    }
    if (!template) {
        setError('Por favor, selecciona una plantilla de mensaje en el Paso 3.');
        return;
    }

    const needsVisitingAgent = template.content.includes('[agente_nombre]') || template.content.includes('[agente_tlf]');
    if (needsVisitingAgent && !visitingAgent) {
      setError('Esta plantilla requiere un agente para la visita. Por favor, selecciónalo en el Paso 4.');
      return;
    }

    const needsAppointment = template.content.includes('[dia]') || template.content.includes('[hora]');
    if (needsAppointment && (!appointmentDate || !appointmentTime)) {
        setError('Esta plantilla requiere una fecha y hora. Por favor, complétalas en el paso correspondiente.');
        return;
    }

    const sanitizedPhone = recipientPhone.replace(/[^0-9]/g, '');
    if (sanitizedPhone.length < 9) {
        setError('Por favor, introduce un número de teléfono válido con el código de país en el Paso 1.');
        return;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const needsAppointment = template?.content.includes('[dia]') || template?.content.includes('[hora]');
  const needsVisitingAgent = template?.content.includes('[agente_nombre]') || template?.content.includes('[agente_tlf]');
  
  const isSendDisabled = 
    !recipientName.trim() || 
    !recipientPhone.trim() || 
    !template || 
    !property || 
    (needsAppointment && (!appointmentDate || !appointmentTime)) ||
    (needsVisitingAgent && !visitingAgent);

  if (isLoading) {
    return (
        <Card className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-white">Cargando datos...</p>
            <p className="text-slate-400 mt-2">Conectando con la base de datos.</p>
          </div>
        </Card>
      );
  }

  if (!recipient) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">Comienza en el Paso 1</p>
          <p className="text-slate-400 mt-2">Por favor, selecciona o añade un destinatario para continuar.</p>
        </div>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">Continúa con el Paso 2</p>
          <p className="text-slate-400 mt-2">Selecciona una propiedad para <span className="font-semibold text-emerald-400">{recipientName}</span>.</p>
        </div>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">Ahora, elige una Plantilla</p>
          <p className="text-slate-400 mt-2">Selecciona una plantilla del panel de la izquierda para previsualizar el mensaje.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="sticky top-8">
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Paso {stepNumber}: Vista Previa y Envío</h2>
                <p className="text-md text-slate-400 font-medium">{template.title} para <span className="text-emerald-400">{recipientName || '...'}</span></p>
            </div>
            
            {template.imageUrl && (
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Tarjeta de Visita Adjunta</label>
                    <img src={template.imageUrl} alt="Tarjeta de visita" className="rounded-lg w-full object-contain max-h-60 border border-slate-700 bg-slate-900/50 p-2"/>
                </div>
            )}

            <div>
                <label htmlFor="message-preview" className="block text-sm font-medium text-slate-400 mb-1">
                    Vista Previa del Mensaje (editable)
                </label>
                <Textarea
                    id="message-preview"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="text-lg leading-relaxed"
                />
            </div>
            
            <div className="space-y-4 p-4 bg-slate-900 rounded-lg">
                <h3 className="font-semibold text-lg text-white">¿Listo para Enviar?</h3>
                {template.imageUrl && (
                    <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 text-sm">
                        <strong>Nota Importante:</strong> La imagen de arriba no se adjuntará automáticamente. Por favor, <strong>adjúntala manually en WhatsApp</strong> después de abrir el chat.
                    </div>
                )}
                <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-md">
                    <p className="text-sm text-slate-400">Enviando a:</p>
                    <p className="font-semibold text-white">{recipientName || 'Nombre no especificado'} sobre la prop. {property.ref}</p>
                    <p className="text-slate-300">{recipientPhone || 'Teléfono no especificado'}</p>
                </div>

                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

                <Button onClick={handleSend} className="w-full !bg-green-500 hover:!bg-green-600 text-white" disabled={isSendDisabled}>
                    <WhatsAppIcon className="h-5 w-5 mr-2" />
                    {isSendDisabled ? 'Completa los pasos anteriores' : `Enviar a ${recipientName}`}
                </Button>
            </div>
        </div>
    </Card>
  );
};

export default Previewer;