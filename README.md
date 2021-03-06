#### Este é o código server side, que incluí o serviço chat e o webcam stream.
Código do Arduino está [neste repo](https://github.com/makerspaceafa/webled-arduino).

## Instalação

### Requirements
- [Node.js](https://nodejs.org/)
- [CMake](https://cmake.org/download/) (required to build opencv4nodejs)

#### Windows
- Instalar Node.js
- Instalar CMake
- Fazer clone do repo / descarregar o projeto
- Dentro do projeto correr os seguintes comandos:
  - `npm install --global windows-build-tools`
  - `npm install`
#### Linux & etc
- `sudo apt install nodejs cmake` (ou o teu package manager)
- `git clone https://github.com/makerspaceafa/webled-server.git`
- `cd webled-server`
- `npm install`
##### Sim, é normal demorar molhos a fazer o 'npm install'. A biblioteca opencv4nodejs que estamos a usar é compilada do zero quando corres este comando... Se descobrirem maneira melhor sejam bem-vindos!

## Configuração
No ficheiro *main.js*:  
Obrigatório definir **arduinoPort** e **devicePort**!  
![imagem](readme_images/config.png)  

Uma maneira fácil de descobrir em que port está o Arduinio é usar o Arduino IDE, que normalmente reconhece automaticamente e avisa:  
![imagem](readme_images/arduino.png)  

## Correr
Se chegaste até aqui sem problemas parabéns!  
Se chegaste até aqui depois de resolver os problemas todos que apareceram sozinh@, ainda mais de parabéns estás!

Agora basta o comando `node main.js` dentro do project folder!
### Whoop ia-me esquecendo mas atenção! Não correr sem o condensador!
O Arduino tem a mania de fazer reset quando recebe informação pela serial port!  
Isto é mau porque não queremos que esteja sempre a fazer reset cada vez que enviamos as mensagens.  
Para impedir estes resets está espetado **condensador do 100nF entre os pins GND e RST**.  
Se não tiverem um condensador destes, outras soluções são discutidas [aqui](https://playground.arduino.cc/Main/DisablingAutoResetOnSerialConnection/).
