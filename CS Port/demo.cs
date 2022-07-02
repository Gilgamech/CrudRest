using System;
using System.Diagnostics;
namespace DemoApplication{
   class Program{
      static void Main(){
         Process obnubilate = new Process();
         obnubilate.StartInfo.FileName = "C:\\Media\\Projects\\GH\\obnubilate.exe";
         //notepad.StartInfo.Arguments = "DemoText";
         obnubilate.Start();
         Console.ReadLine();
      }
   }
}