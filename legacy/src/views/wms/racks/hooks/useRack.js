import qrcode from 'qrcode-generator'
import { useCallback, useEffect, useState } from "react";
import { api } from '../../../../api'

import jsPDF from "jspdf";
export default function useRack() {
  const [racks, setRacks] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [rackRacks, setRackRacks] = useState([])
  const [tramos, setTramos] = useState([])
  const [nivels, setNivels] = useState([])
  const [espacio, setEspacios] = useState([])

  const load_racks = useCallback(async () => {
    try {
      const { data } = await api.get("api/appweb/lista-racks")
      setRacks(data.data.data)
    } catch (error) {
      console.log(error)
    }

  }, [])

  const obtener_racksFiltrado = useCallback(async (params) => {
    try {
      const { data } = await api.get("api/appweb/obtener-racks", {
          params:params
        
      },[])


      const bodegasMap = new Map()
      const racksRacksMap = new Map()
      const tramoMap  = new Map()
      const nivelMap = new Map()
      const espacioMap = new Map()

      const dataFormat =[]

      data.data.forEach(item => {
        if (!bodegasMap.has(item.rack_bod)) {
          bodegasMap.set(item.rack_bod, { value: item.rack_bod, label: item.rack_bod })
        }

        if (!racksRacksMap.has(item.rack_rack)) {
          racksRacksMap.set(item.rack_rack, { value: item.rack_rack, label: item.rack_rack })
        }
        
        if(!tramoMap.has(item.rack_tramo)){
            tramoMap.set(item.rack_tramo,{value: item.rack_tramo, label: item.rack_tramo})
        }

        if(!nivelMap.has(item.rack_nivel)){
            nivelMap.set(item.rack_nivel,{value: item.rack_nivel, label: item.rack_nivel})

        }

        if(!espacioMap.has(item.rack_espacio)){
          espacioMap.set(item.rack_espacio, {value: item.rack_espacio, label: item.rack_espacio})
        }
        const objetoMayuscula = {}
        Object.keys(item).forEach(clave => {
          const nuevaClave = clave.toUpperCase();
          objetoMayuscula[nuevaClave] = item[clave];
        });
        dataFormat.push(
          objetoMayuscula
        )
      })

      setRacks(dataFormat)
      setBodegas(Array.from(bodegasMap.values()))
      setRackRacks(Array.from(racksRacksMap.values()))
      setTramos(Array.from(tramoMap.values()))
      setNivels(Array.from(nivelMap.values()))
      setEspacios(Array.from(espacioMap.values()))

    } catch (error) {
      console.log(error)
    }
  })

  useEffect(() => {

    load_racks()
  }, [load_racks])


  const splitTextToSize = (pdf, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const testWidth = pdf.getStringUnitWidth(testLine) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;

      if (testWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generatePDF = () => {


    const qrStrings = racks.map(i => {
      return {
        localizacion: i.LOCALIZACION,
        localizacionString: i.LOCALIZACIONSTRING
      }
    })


    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [4, 3]
    });

    const pageWidth = 4;
    const pageHeight = 3;
    const qrSizeInches = 1.6;

    qrStrings.forEach((obj, index) => {
      if (index > 0) {
        pdf.addPage([4, 3], 'landscape');
      }

      const qr = qrcode(0, 'H');
      qr.addData(obj.localizacion);
      qr.make();

      const tempImg = new Image();
      const qrDataUrl = qr.createDataURL(10, 0);

      const qrX = (pageWidth - qrSizeInches) / 2;
      const qrY = 0.2; // Margen superior

      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSizeInches, qrSizeInches);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);

      const maxTextWidth = 3.5;
      const lines = splitTextToSize(pdf, obj.localizacionString, maxTextWidth);

      const textStartY = qrY + qrSizeInches + 0.4;

      lines.forEach((line, lineIndex) => {
        pdf.text(line, pageWidth / 2, textStartY + (lineIndex * 0.35), { align: 'center' });
      });

      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.setTextColor(0, 0, 0);
    });

    pdf.save('codigos-qr.pdf');
  };


  return {
    racks,
    load_racks,
    generatePDF,
    obtener_racksFiltrado,
    bodegas,
    rackRacks,
    tramos,
    nivels,
    espacio
  }


}