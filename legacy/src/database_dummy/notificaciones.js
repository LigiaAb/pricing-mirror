const notificaciones_dummy = [
  {
    id_notificacion: 42,
    asunto: "anim esse sunt incididunt incididunt",
    contenido:
      "Tempor sit officia excepteur commodo occaecat. In deserunt consectetur commodo nisi eu ullamco ut minim ad do cupidatat nostrud cupidatat officia. Consectetur minim ex ea ullamco nulla sit consectetur sit excepteur velit elit. Cillum aliquip anim quis irure reprehenderit duis reprehenderit in sint pariatur laboris irure reprehenderit. Anim adipisicing laborum dolore laborum Lorem Lorem eiusmod culpa id esse dolor magna ipsum.",
    created_at: "2011-11-20T21:16:06.230Z",
    fecha_envío: "2011-04-17T21:47:03.455Z",
    destinatario: {
      id: 10,
      nombre: "Test",
    },
    autor: {
      id: 71,
      nombre: "Bettye Cervantes",
    },
    leido: false,
  },
  {
    id_notificacion: 92,
    asunto: "voluptate anim sunt culpa minim",
    contenido:
      "Aute magna quis amet aliqua tempor ullamco est voluptate cillum culpa sint reprehenderit mollit. Dolore eiusmod velit nisi tempor labore esse proident velit quis. Nisi id nostrud nulla excepteur ea ad sunt dolor pariatur irure cillum nostrud qui. Commodo ullamco dolore consequat cillum pariatur irure sit duis officia occaecat proident excepteur occaecat. Laborum voluptate eiusmod dolore irure quis mollit nostrud Lorem.",
    created_at: "2012-04-16T05:51:03.047Z",
    fecha_envío: "2010-07-13T10:10:29.002Z",
    destinatario: {
      id: 10,
      nombre: "Test",
    },
    autor: {
      id: 44,
      nombre: "Moran Stein",
    },
    leido: false,
  },
  {
    id_notificacion: 12,
    asunto: "aute sunt et culpa id",
    contenido:
      "Incididunt et incididunt ut est nulla minim dolore. Velit excepteur officia consequat minim ex laboris magna laborum proident aliquip voluptate ad. Cillum aute ea nulla do fugiat elit aliquip pariatur. Magna occaecat aliqua qui sint excepteur anim est. Excepteur elit ad aliquip cupidatat laborum in.",
    created_at: "2010-07-19T03:10:09.221Z",
    fecha_envío: "2014-10-12T14:59:51.361Z",
    destinatario: {
      id: 10,
      nombre: "Test",
    },
    autor: {
      id: 16,
      nombre: "Tammi Warner",
    },
    leido: false,
  },
  // {
  //   id_notificacion: 81,
  //   asunto: "consequat minim cupidatat sint esse",
  //   contenido:
  //     "Non eu cupidatat esse laboris esse voluptate commodo. Pariatur proident eiusmod proident ex Lorem aliqua dolore non consectetur officia magna ea qui. Quis quis consectetur cupidatat amet eiusmod reprehenderit enim voluptate. Officia ullamco eu ea dolor laborum duis minim enim. Exercitation aliquip cupidatat officia cupidatat consequat mollit nulla.",
  //   created_at: "2014-02-22T09:44:27.630Z",
  //   fecha_envío: "2010-05-23T04:55:51.163Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 68,
  //     nombre: "Rice Delgado",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 47,
  //   asunto: "qui cillum veniam excepteur deserunt",
  //   contenido:
  //     "Aliquip cillum quis irure consequat anim. Consectetur et sunt cupidatat eiusmod est labore Lorem id voluptate ex pariatur. Consequat consequat aute voluptate exercitation eiusmod nulla ad ad anim magna anim veniam aliquip. Amet fugiat culpa esse laboris. Quis sit quis eiusmod exercitation adipisicing eu non reprehenderit nulla excepteur.",
  //   created_at: "2012-12-05T20:40:42.256Z",
  //   fecha_envío: "2011-03-20T14:58:48.438Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 48,
  //     nombre: "June Hull",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 1,
  //   asunto: "mollit culpa exercitation sint fugiat",
  //   contenido:
  //     "Officia adipisicing nostrud deserunt non quis mollit duis laboris. Incididunt laborum dolore elit amet pariatur voluptate labore eu veniam velit irure amet irure occaecat. Culpa magna quis irure labore irure occaecat. Nostrud laborum incididunt ad et adipisicing incididunt excepteur adipisicing sunt. Culpa commodo nisi excepteur eu.",
  //   created_at: "2012-04-30T07:59:12.321Z",
  //   fecha_envío: "2012-12-17T12:45:59.545Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 99,
  //     nombre: "Nancy Grant",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 40,
  //   asunto: "dolor quis incididunt occaecat consectetur",
  //   contenido:
  //     "Excepteur enim aliqua aliqua elit et adipisicing aute qui. Fugiat esse sit et esse nisi qui cupidatat dolor aute elit. Lorem proident ad veniam ipsum eiusmod ullamco aute cupidatat nostrud id fugiat non adipisicing incididunt. Id proident incididunt esse minim reprehenderit mollit incididunt aliquip ea consequat mollit dolore elit velit. Elit pariatur pariatur esse proident sit deserunt non reprehenderit nisi.",
  //   created_at: "2010-08-30T22:14:52.063Z",
  //   fecha_envío: "2011-03-05T02:13:05.254Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 55,
  //     nombre: "Pam Obrien",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 77,
  //   asunto: "ex sit laborum in duis",
  //   contenido:
  //     "Ea laboris pariatur ad aliquip ex fugiat deserunt anim ipsum. Consequat veniam elit sint tempor officia magna sunt pariatur. Exercitation laborum elit nisi reprehenderit occaecat excepteur excepteur mollit incididunt. Anim aliqua veniam officia excepteur adipisicing deserunt nostrud culpa aliquip. Officia pariatur consectetur ullamco consequat amet do aute voluptate ut consequat irure occaecat reprehenderit.",
  //   created_at: "2012-11-20T12:47:05.857Z",
  //   fecha_envío: "2011-07-21T21:16:36.604Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 56,
  //     nombre: "Lora Mitchell",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 66,
  //   asunto: "cillum occaecat et commodo deserunt",
  //   contenido:
  //     "Elit proident laborum aliquip enim ex nisi deserunt adipisicing et et laboris et eu. Ipsum eiusmod nisi enim adipisicing qui reprehenderit in ut. Excepteur ullamco sint nulla ea occaecat ullamco veniam ea culpa occaecat deserunt magna aliqua. Tempor est mollit id proident velit elit consectetur consectetur esse in nisi ut proident qui. Nostrud dolor consectetur excepteur tempor laboris incididunt occaecat sint cupidatat enim laboris sunt.",
  //   created_at: "2011-07-12T01:07:23.588Z",
  //   fecha_envío: "2011-12-19T00:54:52.726Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 29,
  //     nombre: "Poole Hebert",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 52,
  //   asunto: "deserunt duis quis consequat aliquip",
  //   contenido:
  //     "Ipsum excepteur occaecat labore ipsum. Non aliqua laboris laboris duis nisi officia nisi veniam. Id ad sint anim culpa laborum tempor duis enim nisi. Adipisicing consectetur incididunt veniam ea qui qui laboris enim eu laborum excepteur. Enim cillum ullamco esse in Lorem et quis aliquip cupidatat nulla nulla sunt fugiat.",
  //   created_at: "2013-03-13T09:27:41.187Z",
  //   fecha_envío: "2010-12-25T16:58:06.447Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 76,
  //     nombre: "Miriam Stephens",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 31,
  //   asunto: "Lorem minim adipisicing minim commodo",
  //   contenido:
  //     "Irure et velit laborum non. Aliquip exercitation labore nisi dolor Lorem cillum non tempor culpa nisi. Tempor ullamco dolor ad aliquip nostrud culpa ea nisi Lorem officia sint dolore. Consequat nulla nulla excepteur aliqua cillum occaecat labore ad nulla sint. Pariatur nostrud qui voluptate cillum incididunt voluptate enim fugiat ex laboris amet.",
  //   created_at: "2013-04-09T02:00:16.897Z",
  //   fecha_envío: "2014-03-11T14:25:43.636Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 90,
  //     nombre: "Maynard Bartlett",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 55,
  //   asunto: "dolor duis enim tempor ea",
  //   contenido:
  //     "Ad adipisicing elit consequat minim cillum ullamco do culpa. Do nisi dolore laborum labore ipsum irure. In nostrud et sint amet quis fugiat adipisicing ex consequat eiusmod magna sunt consequat. Aute non duis ea exercitation consectetur consequat tempor. Anim deserunt magna ut sit id duis.",
  //   created_at: "2010-09-30T11:01:14.916Z",
  //   fecha_envío: "2012-10-23T19:12:06.743Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 22,
  //     nombre: "Tia Fernandez",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 34,
  //   asunto: "deserunt veniam labore ad voluptate",
  //   contenido:
  //     "Enim qui quis consectetur officia. Lorem non do aute irure consectetur ex deserunt dolore officia do amet. Velit amet ea ea Lorem ea velit. Culpa proident ad ex officia. Dolor proident irure ullamco in veniam.",
  //   created_at: "2014-08-31T06:10:51.154Z",
  //   fecha_envío: "2013-02-18T17:41:35.221Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 88,
  //     nombre: "Karen Sharp",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 84,
  //   asunto: "sint ipsum nulla nostrud minim",
  //   contenido:
  //     "Adipisicing quis enim magna Lorem dolor sit deserunt magna labore. Deserunt magna ex mollit consequat. Nostrud et aliquip eiusmod eu occaecat sunt dolor et. Amet veniam nisi veniam officia eu cillum enim nulla consequat. Eu eu cillum exercitation sint ullamco magna voluptate consequat anim cillum.",
  //   created_at: "2010-04-27T19:26:44.693Z",
  //   fecha_envío: "2011-07-03T00:44:57.331Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 76,
  //     nombre: "Solis Fuentes",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 20,
  //   asunto: "laborum incididunt est consequat ad",
  //   contenido:
  //     "Non id exercitation cupidatat est dolor esse ullamco esse ad. Non cillum consequat laborum et aliquip duis laboris do culpa officia anim aliquip incididunt. Elit nostrud nulla non et consequat adipisicing laboris consectetur adipisicing. Tempor nisi ea aliqua duis est pariatur quis excepteur. In incididunt officia adipisicing sit eiusmod qui sit nostrud quis eu id reprehenderit laboris.",
  //   created_at: "2010-06-22T13:04:01.193Z",
  //   fecha_envío: "2013-04-29T22:06:47.939Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 67,
  //     nombre: "Nita Benton",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 16,
  //   asunto: "esse ut voluptate minim incididunt",
  //   contenido:
  //     "Ea elit enim sit aliquip et quis pariatur velit tempor. Do ad veniam ex nostrud aliquip duis. Cupidatat consequat ullamco fugiat adipisicing nisi do nostrud cupidatat officia reprehenderit qui. Nulla excepteur aliqua pariatur veniam fugiat elit velit commodo fugiat commodo voluptate. In duis ipsum sit quis deserunt.",
  //   created_at: "2013-06-27T14:06:45.422Z",
  //   fecha_envío: "2011-11-20T16:41:20.207Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 59,
  //     nombre: "Heather Weaver",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 64,
  //   asunto: "esse et velit ex do",
  //   contenido:
  //     "Nisi laborum enim esse dolore. Anim quis tempor enim ea laboris id esse ad ipsum nulla nostrud mollit culpa. Occaecat incididunt qui ad minim reprehenderit aliquip sint anim laborum cillum laboris cillum dolore. Elit do est amet cupidatat do Lorem aliquip. Excepteur reprehenderit nulla non est est.",
  //   created_at: "2011-09-19T03:26:10.223Z",
  //   fecha_envío: "2010-03-02T07:20:47.348Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 10,
  //     nombre: "Bettie Brewer",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 71,
  //   asunto: "ad mollit excepteur nostrud sunt",
  //   contenido:
  //     "Sint amet veniam consequat ex dolor culpa ex eiusmod enim in ipsum veniam. Irure enim adipisicing elit reprehenderit quis elit consequat. Laborum sit nisi consequat nisi laboris magna elit esse enim sunt qui sint deserunt. Laboris pariatur non commodo eiusmod id ipsum adipisicing laboris id est sunt mollit et. Aliquip qui consectetur dolore cillum.",
  //   created_at: "2014-08-22T11:27:11.559Z",
  //   fecha_envío: "2013-03-31T08:15:55.614Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 65,
  //     nombre: "Reese Mann",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 713,
  //   asunto: "ad mollit excepteur nostrud sunt",
  //   contenido:
  //     "Sint amet veniam consequat ex dolor culpa ex eiusmod enim in ipsum veniam. Irure enim adipisicing elit reprehenderit quis elit consequat. Laborum sit nisi consequat nisi laboris magna elit esse enim sunt qui sint deserunt. Laboris pariatur non commodo eiusmod id ipsum adipisicing laboris id est sunt mollit et. Aliquip qui consectetur dolore cillum.",
  //   created_at: "2014-08-22T11:27:11.559Z",
  //   fecha_envío: "2013-03-31T08:15:55.614Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 65,
  //     nombre: "Reese Mann",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 714,
  //   asunto: "ad mollit excepteur nostrud sunt",
  //   contenido:
  //     "Sint amet veniam consequat ex dolor culpa ex eiusmod enim in ipsum veniam. Irure enim adipisicing elit reprehenderit quis elit consequat. Laborum sit nisi consequat nisi laboris magna elit esse enim sunt qui sint deserunt. Laboris pariatur non commodo eiusmod id ipsum adipisicing laboris id est sunt mollit et. Aliquip qui consectetur dolore cillum.",
  //   created_at: "2014-08-22T11:27:11.559Z",
  //   fecha_envío: "2013-03-31T08:15:55.614Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 65,
  //     nombre: "Reese Mann",
  //   },
  //   leido: false,
  // },
  // {
  //   id_notificacion: 715,
  //   asunto: "ad mollit excepteur nostrud sunt",
  //   contenido:
  //     "Sint amet veniam consequat ex dolor culpa ex eiusmod enim in ipsum veniam. Irure enim adipisicing elit reprehenderit quis elit consequat. Laborum sit nisi consequat nisi laboris magna elit esse enim sunt qui sint deserunt. Laboris pariatur non commodo eiusmod id ipsum adipisicing laboris id est sunt mollit et. Aliquip qui consectetur dolore cillum.",
  //   created_at: "2014-08-22T11:27:11.559Z",
  //   fecha_envío: "2013-03-31T08:15:55.614Z",
  //   destinatario: {
  //     id: 10,
  //     nombre: "Test",
  //   },
  //   autor: {
  //     id: 65,
  //     nombre: "Reese Mann",
  //   },
  //   leido: false,
  // },
];
export default notificaciones_dummy;
