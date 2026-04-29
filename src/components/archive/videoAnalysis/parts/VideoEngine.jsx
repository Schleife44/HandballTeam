import React from 'react';
import { Video } from 'lucide-react';

const VideoEngine = ({
  videoRef,
  videoUrl,
  isPlaying,
  setIsPlaying,
  onFileClick,
  onTimeUpdate,
  onLoadedMetadata
}) => {
  return (
    <div className="relative flex-1 bg-zinc-950 overflow-hidden border border-white/5 shadow-2xl group min-h-0 transition-all duration-700 rounded-[32px]">
      {videoUrl ? (
        <video 
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={(e) => onTimeUpdate(e.target.currentTime)}
          onLoadedMetadata={(e) => onLoadedMetadata(e.target.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
          className="w-full h-full cursor-pointer object-contain"
        />
      ) : (
        <div 
          onClick={onFileClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.01] transition-all border-2 border-dashed border-white/5 m-4 rounded-[24px]"
        >
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
            <Video size={24} className="text-brand" />
          </div>
          <p className="text-xs font-black uppercase text-zinc-500 italic">Load Tactical Source</p>
        </div>
      )}
    </div>
  );
};

export default VideoEngine;
